import { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "./supabaseClient";

/* ═══════════════════════════════════════════════════════════════
   STORAGE
═══════════════════════════════════════════════════════════════ */
// Using Supabase API

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
const todayStr = () => new Date().toISOString().slice(0, 10);
const nowTime  = () => { const d = new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };
const fmtNum   = (n, d=2) => (isNaN(n)||n==null) ? "—" : Number(n).toFixed(d);
const fmtLKR   = (n) => `LKR ${Number(n||0).toLocaleString("en-LK",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const monthLabel = (ym) => { const [y,m]=ym.split("-"); return new Date(y,m-1,1).toLocaleDateString("en-LK",{month:"long",year:"numeric"}); };
const weekStart  = (dateStr) => { const d=new Date(dateStr); const day=d.getDay(); const diff=day===0?-6:1-day; d.setDate(d.getDate()+diff); return d.toISOString().slice(0,10); };
const weekEnd    = (ws) => { const d=new Date(ws); d.setDate(d.getDate()+6); return d.toISOString().slice(0,10); };
const shortDate  = (s) => new Date(s).toLocaleDateString("en-LK",{day:"2-digit",month:"short"});

/* compute unit-diff array: each entry gets "used" = current - previous reading */
function withUsed(entries) {
  const sorted = [...entries].sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
  return sorted.map((e,i) => ({
    ...e,
    used: i===0 ? 0 : Math.max(0, parseFloat(e.unit||0) - parseFloat(sorted[i-1].unit||0))
  }));
}

const APPLIANCE_PRESETS = [
  "🌬️ AC – Bedroom 1","🌬️ AC – Bedroom 2","🌬️ AC – Living Room",
  "❄️ Refrigerator","🚿 Water Heater","🫧 Washing Machine",
  "📺 TV","📡 Router/Modem","💡 Main Lights","🌀 Fan",
  "🍳 Microwave","👕 Iron"
];

/* ═══════════════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500;600;700;800&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#07090f; --s1:#0d1117; --s2:#111827; --s3:#1a2236;
  --border:#1e2d45; --border2:#243552;
  --cyan:#00d4ff; --cyan2:#0099cc; --green:#00e5a0; --amber:#f59e0b; --red:#ff4d6a; --purple:#a78bfa;
  --text:#e2eaf5; --muted:#4a6080; --sub:#8899bb;
  --font:'Outfit',sans-serif; --mono:'DM Mono',monospace;
  --r:12px; --r2:8px;
}
body{background:var(--bg);color:var(--text);font-family:var(--font);line-height:1.5;min-height:100vh;}
::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:var(--s1);}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px;}

/* ── LAYOUT ── */
.shell{display:flex;min-height:100vh;}
.aside{width:230px;background:var(--s1);border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;position:sticky;top:0;height:100vh;overflow-y:auto;}
.brand{padding:22px 20px 18px;border-bottom:1px solid var(--border);}
.brand-icon{font-size:28px;line-height:1;}
.brand-name{font-size:15px;font-weight:800;color:var(--cyan);letter-spacing:.04em;margin-top:4px;}
.brand-sub{font-size:11px;color:var(--muted);font-family:var(--mono);}
.nav-section{padding:16px 12px 8px;}
.nav-label{font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.12em;text-transform:uppercase;padding:0 8px 6px;}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:var(--r2);border:none;background:transparent;color:var(--sub);font-family:var(--font);font-size:13px;font-weight:500;width:100%;cursor:pointer;transition:all .15s;text-align:left;}
.nav-item:hover{background:var(--s2);color:var(--text);}
.nav-item.active{background:rgba(0,212,255,.1);color:var(--cyan);font-weight:600;}
.nav-item.active .ni{color:var(--cyan);}
.ni{font-size:16px;width:20px;text-align:center;}
.aside-footer{margin-top:auto;padding:16px 20px;border-top:1px solid var(--border);}
.aside-acct{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;}
.aside-acct-val{font-family:var(--mono);font-size:12px;color:var(--cyan);margin-top:3px;word-break:break-all;}
.aside-rate{font-size:11px;color:var(--muted);margin-top:8px;}
.aside-rate span{color:var(--green);font-weight:600;}

.main{flex:1;padding:28px 32px;overflow-y:auto;max-width:calc(100vw - 230px);}

/* ── HEADER ── */
.ph{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
.ph-left .pt{font-size:22px;font-weight:800;letter-spacing:-.02em;}
.ph-left .ps{font-size:13px;color:var(--muted);margin-top:2px;}

/* ── VIEW TOGGLE ── */
.vtab{display:flex;background:var(--s2);border:1px solid var(--border);border-radius:var(--r);padding:4px;gap:3px;}
.vt{padding:7px 18px;border-radius:var(--r2);border:none;font-family:var(--font);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;background:transparent;color:var(--muted);}
.vt:hover{color:var(--text);}
.vt.active{background:var(--cyan);color:#000;}

/* ── CARDS ── */
.grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:20px;}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px;}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;}
.card{background:var(--s1);border:1px solid var(--border);border-radius:var(--r);padding:20px;}
.card-sm{background:var(--s1);border:1px solid var(--border);border-radius:var(--r);padding:16px;}
.card-label{font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px;}
.card-val{font-family:var(--mono);font-size:26px;font-weight:500;color:var(--cyan);}
.card-val.g{color:var(--green);}.card-val.a{color:var(--amber);}.card-val.p{color:var(--purple);}
.card-meta{font-size:12px;color:var(--muted);margin-top:5px;}

/* ── FORM ── */
.form-block{margin-bottom:24px;}
.form-title{font-size:13px;font-weight:700;color:var(--sub);text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border);}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
.fg{display:flex;flex-direction:column;gap:5px;}
.fg.span2{grid-column:1/-1;}
label{font-size:11px;font-weight:600;color:var(--sub);letter-spacing:.06em;text-transform:uppercase;}
input,select,textarea{
  background:var(--s2);border:1px solid var(--border);border-radius:var(--r2);
  color:var(--text);font-family:var(--font);font-size:13px;padding:9px 12px;
  outline:none;transition:border-color .15s;width:100%;
}
input:focus,select:focus,textarea:focus{border-color:var(--cyan);}
input::placeholder{color:var(--muted);}
input[type=checkbox]{width:auto;width:16px;height:16px;accent-color:var(--cyan);cursor:pointer;}
select option{background:var(--s2);}
textarea{resize:vertical;min-height:72px;}

/* time row */
.time-row{display:flex;gap:8px;align-items:center;}
.time-row input{flex:1;}

/* ── BUTTONS ── */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 18px;border-radius:var(--r2);border:none;font-family:var(--font);font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;}
.btn-primary{background:var(--cyan);color:#000;}
.btn-primary:hover{background:var(--cyan2);color:#fff;}
.btn-outline{background:transparent;color:var(--sub);border:1px solid var(--border);}
.btn-outline:hover{border-color:var(--cyan);color:var(--cyan);}
.btn-sm{padding:6px 12px;font-size:12px;}
.btn-ghost{background:transparent;color:var(--muted);border:1px solid var(--border);padding:4px 10px;font-size:12px;border-radius:6px;}
.btn-ghost:hover{color:var(--red);border-color:var(--red);}
.btn-danger{background:rgba(255,77,106,.1);color:var(--red);border:1px solid rgba(255,77,106,.3);}
.btn-danger:hover{background:rgba(255,77,106,.2);}
.btn-full{width:100%;padding:12px;}
.btn-now{background:var(--s3);color:var(--cyan);border:1px solid var(--border2);padding:8px 12px;font-size:12px;border-radius:var(--r2);cursor:pointer;font-family:var(--font);font-weight:600;white-space:nowrap;transition:all .15s;}
.btn-now:hover{border-color:var(--cyan);}

/* ── APPLIANCE TAGS ── */
.ap-grid{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px;}
.ap-btn{padding:5px 12px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--sub);font-size:12px;font-family:var(--font);cursor:pointer;transition:all .15s;}
.ap-btn:hover{border-color:var(--sub);color:var(--text);}
.ap-btn.sel{background:rgba(0,212,255,.12);border-color:var(--cyan);color:var(--cyan);}
.ap-sel-list{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
.ap-tag{display:inline-flex;align-items:center;gap:5px;background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.2);color:var(--cyan);border-radius:20px;font-size:11px;padding:3px 10px;}
.ap-rm{cursor:pointer;opacity:.5;}.ap-rm:hover{opacity:1;}

/* ── IMAGE UPLOAD ── */
.img-box{border:2px dashed var(--border2);border-radius:var(--r);min-height:110px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:border-color .15s;overflow:hidden;position:relative;}
.img-box:hover{border-color:var(--cyan);}
.img-box img{max-height:200px;max-width:100%;object-fit:contain;}
.img-ph{text-align:center;color:var(--muted);font-size:13px;padding:20px;}
.img-ph span{display:block;font-size:24px;margin-bottom:6px;}

/* ── TABLE ── */
.tbl-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;font-size:13px;}
thead th{padding:9px 14px;text-align:left;font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid var(--border);white-space:nowrap;}
tbody td{padding:11px 14px;border-bottom:1px solid rgba(30,45,74,.4);vertical-align:middle;}
tbody tr:hover td{background:rgba(255,255,255,.015);}
.mono{font-family:var(--mono);}
.cyan{color:var(--cyan);}.green{color:var(--green);}.amber{color:var(--amber);}.red{color:var(--red);}.purple{color:var(--purple);}
.muted{color:var(--muted);}

/* ── BADGE ── */
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700;}
.badge-green{background:rgba(0,229,160,.12);color:var(--green);}
.badge-red{background:rgba(255,77,106,.12);color:var(--red);}
.badge-cyan{background:rgba(0,212,255,.1);color:var(--cyan);}
.badge-amber{background:rgba(245,158,11,.12);color:var(--amber);}

/* ── BAR CHART ── */
.barchart{display:flex;align-items:flex-end;gap:6px;height:120px;padding-bottom:0;}
.bar-col{display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;min-width:32px;}
.bar-val{font-size:9px;font-family:var(--mono);color:var(--cyan);}
.bar-body{width:100%;border-radius:3px 3px 0 0;background:linear-gradient(180deg,var(--cyan),rgba(0,180,220,.3));transition:height .3s ease;min-height:3px;}
.bar-lbl{font-size:10px;color:var(--muted);margin-top:5px;}

/* ── FORECAST BAR ── */
.fc-row{margin-bottom:18px;}
.fc-head{display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;}
.fc-lbl{color:var(--sub);}
.fc-bg{height:10px;background:var(--s3);border-radius:5px;overflow:hidden;}
.fc-fill{height:100%;border-radius:5px;transition:width .5s ease;}

/* ── ALERT / TOAST ── */
.toast{position:fixed;top:20px;right:24px;z-index:9999;padding:12px 18px;border-radius:var(--r);font-size:13px;font-weight:600;animation:slideIn .25s ease;max-width:320px;box-shadow:0 8px 32px rgba(0,0,0,.4);}
.toast-ok{background:rgba(0,229,160,.15);border:1px solid rgba(0,229,160,.4);color:var(--green);}
.toast-warn{background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.4);color:var(--amber);}
@keyframes slideIn{from{opacity:0;transform:translateY(-10px);}to{opacity:1;transform:translateY(0);}}

/* ── MODAL ── */
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px;}
.modal{background:var(--s1);border:1px solid var(--border2);border-radius:var(--r);padding:28px;max-width:420px;width:100%;}
.modal-title{font-size:16px;font-weight:700;margin-bottom:8px;}
.modal-body{color:var(--sub);font-size:13px;margin-bottom:20px;}
.modal-actions{display:flex;gap:10px;}

/* ── SECTION DIVIDER ── */
.divider{height:1px;background:var(--border);margin:22px 0;}

/* ── EMPTY STATE ── */
.empty{text-align:center;padding:48px 20px;color:var(--muted);}
.empty-icon{font-size:36px;margin-bottom:12px;}
.empty-msg{font-size:14px;}

/* ── DIFF PREVIEW ── */
.diff-banner{display:flex;align-items:center;justify-content:space-between;background:rgba(0,229,160,.07);border:1px solid rgba(0,229,160,.2);border-radius:var(--r2);padding:12px 16px;margin-bottom:18px;}
.diff-text{font-size:13px;color:var(--sub);}
.diff-val{font-family:var(--mono);font-size:16px;font-weight:500;color:var(--green);}

/* ── WEEK GROUP ── */
.week-group{margin-bottom:20px;}
.week-group-hdr{background:var(--s2);border:1px solid var(--border);border-radius:var(--r2);padding:10px 16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;}
.week-group-title{font-size:12px;font-weight:700;color:var(--sub);}
.week-group-stats{display:flex;gap:20px;font-size:12px;}
.wgs-item{display:flex;flex-direction:column;align-items:flex-end;}
.wgs-label{font-size:10px;color:var(--muted);}
.wgs-val{font-family:var(--mono);font-weight:500;}

/* ── SETTINGS ── */
.settings-wrap{max-width:560px;}

/* ── PAYMENT HISTORY CARD ── */
.pay-item{padding:14px 0;border-bottom:1px solid rgba(30,45,74,.5);}
.pay-item:last-child{border-bottom:none;}
.pay-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:5px;}
.pay-month{font-size:14px;font-weight:700;}
.pay-detail{font-size:11px;color:var(--muted);line-height:1.7;}

@media(max-width:768px){
  .aside{
    position:fixed; left:-230px; z-index:9001; transition:left .3s ease; 
    box-shadow:10px 0 30px rgba(0,0,0,.5); width:230px;
  }
  .aside.open{left:0;}
  .main{max-width:100%; padding:16px;}
  .ph-left{text-align:center; width:100%;}
  .pt{font-size:20px;}
  .vtab{width:100%; order:2;}
  .grid4{grid-template-columns:repeat(2,1fr);}
  .grid3{grid-template-columns:repeat(2,1fr);}
  .hamburger{
    display:flex; position:absolute; left:16px; top:28px; background:var(--s2);
    border:1px solid var(--border); color:var(--cyan); font-size:20px;
    padding:8px; border-radius:var(--r2); cursor:pointer; z-index:9002;
  }
  .overlay-bg{
    position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:9000;
    opacity:0; visibility:hidden; transition:all .3s;
  }
  .overlay-bg.open{opacity:1; visibility:visible;}
  
  /* Tables */
  .tbl-wrap{overflow-x:auto; -webkit-overflow-scrolling:touch;}
}
@media(min-width:769px){
  .hamburger{display:none;}
}
`;

/* ═══════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════ */
const INIT = {
  settings: { accountNumber:"", ownerName:"", lkrPerUnit:"30" },
  entries: [],
  payments: [],
};

export default function App() {
  const [data, setData] = useState(INIT);
  const [page, setPage] = useState("dashboard");
  const [viewMode, setViewMode] = useState("daily"); // daily | weekly | monthly
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!session) return;
      try {
        const [settingsRes, entriesRes, paymentsRes] = await Promise.all([
          supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
          supabase.from("entries").select("*"),
          supabase.from("payments").select("*")
        ]);
        setData({
          settings: settingsRes.data || INIT.settings,
          entries: entriesRes.data || [],
          payments: paymentsRes.data || []
        });
      } catch (e) {
        console.error("Error loading data", e);
      } finally {
        setLoaded(true);
      }
    }
    loadData();
  }, [session]);

  const showToast = (msg, type="ok") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null), 3200);
  };

  const updateSettings = async (s) => {
    setData(d=>({...d,settings:s}));
    await supabase.from("settings").upsert({ id: 1, user_id: session.user.id, ...s });
  };
  const addEntry = async (e) => {
    setData(d=>({...d,entries:[...d.entries,e]}));
    await supabase.from("entries").insert({ ...e, user_id: session.user.id });
  };
  const deleteEntry = async (id) => {
    setData(d=>({...d,entries:d.entries.filter(e=>e.id!==id)}));
    await supabase.from("entries").delete().eq("id", id);
  };
  const upsertPayment = async (p) => {
    setData(d=>{
      const idx=d.payments.findIndex(x=>x.month===p.month);
      if(idx>=0){ const arr=[...d.payments]; arr[idx]=p; return {...d,payments:arr}; }
      return {...d,payments:[...d.payments,p]};
    });
    await supabase.from("payments").upsert({ ...p, user_id: session.user.id });
  };
  const clearAllData = async () => {
    setData(INIT);
    await supabase.from("entries").delete().neq("id", 0);
    await supabase.from("payments").delete().neq("id", 0);
  };

  if(!session) {
    const isReset = window.location.hash.includes("type=recovery") || window.location.hash.includes("access_token=");
    return (
      <>
        <style>{CSS}</style>
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
        {isReset ? <ResetPasswordScreen showToast={showToast} /> : <LoginScreen showToast={showToast} />}
      </>
    );
  }

  if(!loaded) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#07090f",color:"#00d4ff",fontFamily:"monospace",fontSize:14}}>
      ⚡ Loading ECB Tracker…
    </div>
  );

  const rate = parseFloat(data.settings.lkrPerUnit)||30;

  return (
    <>
      <style>{CSS}</style>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      <div className="shell">
        <div className={`overlay-bg ${isMenuOpen ? "open" : ""}`} onClick={() => setIsMenuOpen(false)} />
        <Sidebar page={page} setPage={setPage} settings={data.settings} viewMode={viewMode} setViewMode={setViewMode} showViewToggle={["dashboard","records"].includes(page)} isMenuOpen={isMenuOpen} closeMenu={() => setIsMenuOpen(false)} />
        <main className="main">
          {page==="dashboard" && <PageDashboard data={data} rate={rate} viewMode={viewMode} setViewMode={setViewMode} toggleMenu={() => setIsMenuOpen(!isMenuOpen)} />}
          {page==="log"       && <PageLog entries={data.entries} rate={rate} addEntry={addEntry} showToast={showToast} toggleMenu={() => setIsMenuOpen(!isMenuOpen)} />}
          {page==="records"   && <PageRecords data={data} rate={rate} viewMode={viewMode} setViewMode={setViewMode} deleteEntry={deleteEntry} showToast={showToast} toggleMenu={() => setIsMenuOpen(!isMenuOpen)} />}
          {page==="payments"  && <PagePayments data={data} rate={rate} upsertPayment={upsertPayment} showToast={showToast} toggleMenu={() => setIsMenuOpen(!isMenuOpen)} />}
          {page==="forecast"  && <PageForecast data={data} rate={rate} showToast={showToast} toggleMenu={() => setIsMenuOpen(!isMenuOpen)} />}
          {page==="settings"  && <PageSettings settings={data.settings} updateSettings={updateSettings} showToast={showToast} onClear={()=>{clearAllData();showToast("All data cleared","warn");}} toggleMenu={() => setIsMenuOpen(!isMenuOpen)} />}
          {page==="reports"   && <PageReports data={data} rate={rate} toggleMenu={() => setIsMenuOpen(!isMenuOpen)} />}
        </main>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════════ */
function Sidebar({ page, setPage, settings, viewMode, setViewMode, showViewToggle, isMenuOpen, closeMenu }) {
  const nav = [
    {id:"dashboard",icon:"⚡",label:"Dashboard"},
    {id:"log",icon:"📝",label:"Log Reading"},
    {id:"records",icon:"📋",label:"Records"},
    {id:"payments",icon:"💳",label:"Payments"},
    {id:"forecast",icon:"🔮",label:"Forecast"},
    {id:"reports",icon:"📊",label:"Reports"},
    {id:"settings",icon:"⚙️",label:"Settings"},
  ];
  return (
    <aside className={`aside ${isMenuOpen ? "open" : ""}`}>
      <div className="brand" style={{display:"flex", flexDirection:"column", alignItems:"center", paddingBottom:"10px"}}>
        <img src="/assets/logo.png" alt="ECB Tracker Logo" style={{maxWidth:"150px", maxHeight:"60px", objectFit:"contain"}} />
        <div className="brand-sub" style={{marginTop:"8px"}}>Electricity Monitor</div>
      </div>
      <div className="nav-section">
        <div className="nav-label">Navigation</div>
        {nav.map(n=>(
          <button key={n.id} className={`nav-item ${page===n.id?"active":""}`} onClick={()=>{setPage(n.id); closeMenu();}}>
            <span className="ni">{n.icon}</span><span>{n.label}</span>
          </button>
        ))}
      </div>
      <div style={{marginTop:"auto", padding:"10px 16px", borderTop:"1px solid var(--border)"}}>
        <button className="nav-item" onClick={() => { if(window.confirm("Sign Out?")) supabase.auth.signOut(); }} style={{color:"var(--red)", width:"100%", justifyContent:"flex-start"}}>
          <span className="ni">🚪</span><span>Sign Out</span>
        </button>
      </div>
      <div className="aside-footer">
        <div className="aside-acct">ECB Account</div>
        <div className="aside-acct-val">{settings.accountNumber||"—"}</div>
        <div className="aside-rate">Rate: <span>LKR {settings.lkrPerUnit||"30"}/u</span></div>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: DASHBOARD
═══════════════════════════════════════════════════════════════ */
function PageDashboard({ data, rate, viewMode, setViewMode, toggleMenu }) {
  const computed = withUsed(data.entries);
  const today = todayStr();

  // stat helpers
  const sum = (arr, field) => arr.reduce((s,e)=>s+(e[field]||0),0);

  const todayEntries  = computed.filter(e=>e.date===today);
  const todayUnits    = sum(todayEntries,"used");

  const thisWeekS     = weekStart(today);
  const weekEntries   = computed.filter(e=>e.date>=thisWeekS&&e.date<=weekEnd(thisWeekS));
  const weekUnits     = sum(weekEntries,"used");

  const thisMonth     = today.slice(0,7);
  const monthEntries  = computed.filter(e=>e.date.startsWith(thisMonth));
  const monthUnits    = sum(monthEntries,"used");

  // last 7 days bar chart
  const last7 = Array.from({length:7},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-6+i);
    const dk=d.toISOString().slice(0,10);
    const u=sum(computed.filter(e=>e.date===dk),"used");
    return { label:d.toLocaleDateString("en-LK",{weekday:"short"}), units:u };
  });
  const maxU = Math.max(...last7.map(d=>d.units),0.1);

  return (
    <div>
      <div className="ph">
        <div className="ph-left">
          <button className="hamburger" onClick={toggleMenu}>☰</button>
          <div className="pt">Dashboard</div>
          <div className="ps">Overview of your electricity consumption</div>
        </div>
        <div className="vtab">
          {["daily","weekly","monthly"].map(m=>(
            <button key={m} className={`vt ${viewMode===m?"active":""}`} onClick={()=>setViewMode(m)}>
              {m.charAt(0).toUpperCase()+m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid4">
        <Stat label="Today" val={`${fmtNum(todayUnits)} kWh`} sub={fmtLKR(todayUnits*rate)} color="" />
        <Stat label="This Week" val={`${fmtNum(weekUnits)} kWh`} sub={fmtLKR(weekUnits*rate)} color="g" />
        <Stat label="This Month" val={`${fmtNum(monthUnits)} kWh`} sub={fmtLKR(monthUnits*rate)} color="a" />
        <Stat label="Rate" val={`LKR ${rate}`} sub="per kWh" color="p" />
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div className="card-label">Last 7 Days — Daily Usage (kWh)</div>
        <div className="barchart">
          {last7.map((d,i)=>(
            <div key={i} className="bar-col">
              {d.units>0&&<div className="bar-val">{fmtNum(d.units,1)}</div>}
              <div className="bar-body" style={{height:`${Math.max((d.units/maxU)*100,d.units>0?6:2)}px`,opacity:d.units>0?1:.2}} />
              <div className="bar-lbl">{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* View-mode-specific table */}
      {viewMode==="daily"   && <DailyTable   entries={computed} rate={rate} />}
      {viewMode==="weekly"  && <WeeklyTable  entries={computed} rate={rate} />}
      {viewMode==="monthly" && <MonthlyTable entries={computed} rate={rate} payments={data.payments} />}
    </div>
  );
}

function Stat({ label, val, sub, color }) {
  return (
    <div className="card-sm">
      <div className="card-label">{label}</div>
      <div className={`card-val ${color}`}>{val}</div>
      <div className="card-meta">{sub}</div>
    </div>
  );
}

/* ═══ VIEW-MODE TABLES ══ */
function DailyTable({ entries, rate }) {
  // group by date
  const byDate = {};
  entries.forEach(e=>{
    if(!byDate[e.date]) byDate[e.date]={date:e.date,units:0,cost:0,readings:0,appliances:new Set(),notes:[]};
    byDate[e.date].units+=e.used;
    byDate[e.date].cost+=e.used*rate;
    byDate[e.date].readings++;
    (e.appliances||[]).forEach(a=>byDate[e.date].appliances.add(a));
    if(e.note) byDate[e.date].notes.push(e.note);
  });
  const rows = Object.values(byDate).sort((a,b)=>b.date.localeCompare(a.date));

  return (
    <div className="card">
      <div className="card-label" style={{marginBottom:14}}>Daily Consumption</div>
      {rows.length===0&&<EmptyState msg="No readings yet. Log your first meter reading!" />}
      <div className="tbl-wrap">
        <table>
          <thead><tr>
            <th>Date</th><th>Units Consumed</th><th>Cost (LKR)</th><th>Readings</th><th>Active Appliances</th><th>Notes</th>
          </tr></thead>
          <tbody>{rows.map(r=>(
            <tr key={r.date}>
              <td className="mono" style={{fontSize:12}}>{r.date}</td>
              <td><span className="cyan mono">{fmtNum(r.units)} kWh</span></td>
              <td className="green">{fmtLKR(r.cost)}</td>
              <td><span className="badge badge-cyan">{r.readings}</span></td>
              <td>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {[...r.appliances].slice(0,3).map((a,i)=><span key={i} className="ap-tag" style={{fontSize:10,padding:"2px 7px"}}>{a}</span>)}
                  {r.appliances.size>3&&<span className="muted" style={{fontSize:11}}>+{r.appliances.size-3}</span>}
                </div>
              </td>
              <td style={{maxWidth:160,fontSize:12,color:"var(--muted)"}}>{r.notes[0]||"—"}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function WeeklyTable({ entries, rate }) {
  const byWeek = {};
  entries.forEach(e=>{
    const ws=weekStart(e.date);
    if(!byWeek[ws]) byWeek[ws]={ws,we:weekEnd(ws),units:0,days:new Set(),minUnit:Infinity,maxUnit:-Infinity};
    byWeek[ws].units+=e.used;
    byWeek[ws].days.add(e.date);
    const u=parseFloat(e.unit||0);
    if(u<byWeek[ws].minUnit) byWeek[ws].minUnit=u;
    if(u>byWeek[ws].maxUnit) byWeek[ws].maxUnit=u;
  });
  const rows=Object.values(byWeek).sort((a,b)=>b.ws.localeCompare(a.ws));

  return (
    <div className="card">
      <div className="card-label" style={{marginBottom:14}}>Weekly Summary</div>
      {rows.length===0&&<EmptyState msg="No data yet." />}
      <div className="tbl-wrap">
        <table>
          <thead><tr>
            <th>Week</th><th>Start Unit</th><th>End Unit</th><th>Total Units Used</th><th>Total Cost</th><th>Avg/Day</th><th>Days Logged</th>
          </tr></thead>
          <tbody>{rows.map(r=>(
            <tr key={r.ws}>
              <td style={{fontSize:12}}>{shortDate(r.ws)} – {shortDate(r.we)}</td>
              <td className="mono muted">{r.minUnit===Infinity?"—":fmtNum(r.minUnit,1)}</td>
              <td className="mono muted">{r.maxUnit===-Infinity?"—":fmtNum(r.maxUnit,1)}</td>
              <td><span className="cyan mono">{fmtNum(r.units)} kWh</span></td>
              <td className="green">{fmtLKR(r.units*rate)}</td>
              <td className="mono" style={{fontSize:12,color:"var(--purple)"}}>{fmtNum(r.units/(r.days.size||1),2)}</td>
              <td><span className="badge badge-cyan">{r.days.size}d</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function MonthlyTable({ entries, rate, payments }) {
  const byMonth={};
  entries.forEach(e=>{
    const mk=e.date.slice(0,7);
    if(!byMonth[mk]) byMonth[mk]={mk,units:0,days:new Set(),minUnit:Infinity,maxUnit:-Infinity};
    byMonth[mk].units+=e.used;
    byMonth[mk].days.add(e.date);
    const u=parseFloat(e.unit||0);
    if(u<byMonth[mk].minUnit) byMonth[mk].minUnit=u;
    if(u>byMonth[mk].maxUnit) byMonth[mk].maxUnit=u;
  });
  const rows=Object.values(byMonth).sort((a,b)=>b.mk.localeCompare(a.mk));

  return (
    <div className="card">
      <div className="card-label" style={{marginBottom:14}}>Monthly Summary</div>
      {rows.length===0&&<EmptyState msg="No data yet." />}
      <div className="tbl-wrap">
        <table>
          <thead><tr>
            <th>Month</th><th>Units Used</th><th>Estimated Bill</th><th>Payment</th><th>Days Logged</th>
          </tr></thead>
          <tbody>{rows.map(r=>{
            const pay=payments.find(p=>p.month===r.mk);
            return (
              <tr key={r.mk}>
                <td style={{fontWeight:600}}>{monthLabel(r.mk)}</td>
                <td><span className="cyan mono">{fmtNum(r.units)} kWh</span></td>
                <td className="amber">{fmtLKR(r.units*rate)}</td>
                <td>
                  {pay
                    ? <span className={`badge ${pay.paid?"badge-green":"badge-red"}`}>{pay.paid?"✅ Paid":"⏳ Pending"}</span>
                    : <span className="muted" style={{fontSize:12}}>Not recorded</span>}
                </td>
                <td>{r.days.size}d</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: LOG ENTRY
═══════════════════════════════════════════════════════════════ */
function PageLog({ entries, rate, addEntry, showToast, toggleMenu }) {
  const blank = { date:todayStr(), time:nowTime(), unit:"", note:"", appliances:[], imgData:null, imgName:"" };
  const [form, setForm] = useState(blank);
  const [customAp, setCustomAp] = useState("");
  const imgRef = useRef();

  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  // last reading for diff
  const sorted=[...entries].sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
  const lastEntry=sorted[sorted.length-1];
  const unitDiff = (lastEntry&&form.unit&&!isNaN(parseFloat(form.unit)))
    ? Math.max(0, parseFloat(form.unit)-parseFloat(lastEntry.unit))
    : null;

  const toggleAp = (a) => setF("appliances", form.appliances.includes(a)
    ? form.appliances.filter(x=>x!==a)
    : [...form.appliances,a]);

  const addCustomAp = () => {
    const a=customAp.trim();
    if(!a||form.appliances.includes(a)) return;
    setF("appliances",[...form.appliances,a]);
    setCustomAp("");
  };

  const handleImg = (e) => {
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>setForm(f=>({...f,imgData:reader.result,imgName:file.name, file: file}));
    reader.readAsDataURL(file);
  };

  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if(!form.unit||isNaN(parseFloat(form.unit))){ showToast("Enter a valid meter reading","warn"); return; }
    if(!form.date){ showToast("Select a date","warn"); return; }

    setSaving(true);
    let finalImgData = form.imgData;

    try {
      if (form.file) {
        const ext = form.file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const { error } = await supabase.storage.from('meter_images').upload(fileName, form.file);
        if (!error) {
           const { data: pubData } = supabase.storage.from('meter_images').getPublicUrl(fileName);
           finalImgData = pubData.publicUrl;
        }
      }

      const entry = {
        ...form,
        id: Date.now(),
        unit: parseFloat(form.unit),
        imgData: finalImgData
      };
      delete entry.file;

      await addEntry(entry);
      showToast("✅ Meter reading saved!");
      setForm({...blank, date:todayStr(), time:nowTime()});
    } catch (e) {
      showToast("Error saving reading", "warn");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="ph">
        <div className="ph-left">
          <button className="hamburger" onClick={toggleMenu}>☰</button>
          <div className="pt">Log Meter Reading</div>
          <div className="ps">Enter your electricity meter details and proof</div>
        </div>
        {lastEntry && (
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:"var(--muted)"}}>Previous Reading</div>
            <div style={{fontFamily:"var(--mono)",color:"var(--cyan)",fontSize:20,fontWeight:500}}>{fmtNum(lastEntry.unit,2)} kWh</div>
            <div style={{fontSize:11,color:"var(--muted)"}}>{lastEntry.date} · {lastEntry.time}</div>
          </div>
        )}
      </div>

      {unitDiff!==null && (
        <div className="diff-banner">
          <span className="diff-text">⚡ Units since last reading: <strong className="green">{fmtNum(unitDiff,2)} kWh</strong></span>
          <span className="diff-val">{fmtLKR(unitDiff*rate)}</span>
        </div>
      )}

      <div className="card">
        {/* ── Date & Time ── */}
        <div className="form-block">
          <div className="form-title">📅 Date & Time</div>
          <div className="row2">
            <div className="fg">
              <label>Reading Date</label>
              <input type="date" value={form.date} max={todayStr()} onChange={e=>setF("date",e.target.value)} />
            </div>
            <div className="fg">
              <label>Reading Time</label>
              <div className="time-row">
                <input type="time" value={form.time} onChange={e=>setF("time",e.target.value)} />
                <button className="btn-now" onClick={()=>setF("time",nowTime())}>🕐 Now</button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Meter Reading ── */}
        <div className="form-block">
          <div className="form-title">⚡ Meter Reading</div>
          <div className="row2">
            <div className="fg">
              <label>Current Meter Unit (kWh)</label>
              <input
                type="number" step="0.01" min="0"
                placeholder="e.g. 1842.50"
                value={form.unit}
                onChange={e=>setF("unit",e.target.value)}
                style={{fontFamily:"var(--mono)",fontSize:22,fontWeight:500,color:"var(--cyan)"}}
              />
            </div>
            <div className="fg">
              <label>Meter Photo (Proof)</label>
              <input ref={imgRef} type="file" accept="image/*" capture="environment" onChange={handleImg} style={{display:"none"}} />
              <div className="img-box" onClick={()=>imgRef.current.click()}>
                {form.imgData
                  ? <img src={form.imgData} alt="meter proof" />
                  : <div className="img-ph"><span>📷</span>Click to upload meter photo<br/><small style={{fontSize:11,color:"var(--muted)"}}>JPG, PNG supported</small></div>
                }
              </div>
              {form.imgName && <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>{form.imgName}</div>}
            </div>
          </div>
        </div>

        {/* ── Appliances ── */}
        <div className="form-block">
          <div className="form-title">🏠 Active Appliances / Devices</div>
          <div className="ap-grid">
            {APPLIANCE_PRESETS.map(a=>(
              <button key={a} className={`ap-btn ${form.appliances.includes(a)?"sel":""}`} onClick={()=>toggleAp(a)}>{a}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:8,marginTop:4}}>
            <input
              placeholder="Add custom appliance… (press Enter)"
              value={customAp}
              onChange={e=>setCustomAp(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&addCustomAp()}
              style={{flex:1}}
            />
            <button className="btn btn-outline btn-sm" onClick={addCustomAp}>+ Add</button>
          </div>
          {form.appliances.length>0&&(
            <div className="ap-sel-list">
              {form.appliances.map(a=>(
                <span key={a} className="ap-tag">{a}<span className="ap-rm" onClick={()=>setF("appliances",form.appliances.filter(x=>x!==a))}>✕</span></span>
              ))}
            </div>
          )}
        </div>

        {/* ── Notes ── */}
        <div className="form-block">
          <div className="form-title">🗒️ Notes</div>
          <div className="fg">
            <label>Additional Notes (optional)</label>
            <textarea
              placeholder="e.g. AC ran all night, guests at home, power cut 3hrs, water heater left on…"
              value={form.note}
              onChange={e=>setF("note",e.target.value)}
            />
          </div>
        </div>

        <button className="btn btn-primary btn-full" onClick={submit} disabled={saving}>
          {saving ? "⏳ Saving..." : "⚡ Save Meter Reading"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: RECORDS
═══════════════════════════════════════════════════════════════ */
function PageRecords({ data, rate, viewMode, setViewMode, deleteEntry, showToast, toggleMenu }) {
  const [delId, setDelId] = useState(null);
  const computed = withUsed(data.entries).reverse(); // newest first

  const confirmDelete = () => { deleteEntry(delId); setDelId(null); showToast("Reading deleted","warn"); };

  return (
    <div>
      <div className="ph">
        <div className="ph-left">
          <button className="hamburger" onClick={toggleMenu}>☰</button>
          <div className="pt">Records</div>
          <div className="ps">{data.entries.length} total readings logged</div>
        </div>
        <div className="vtab">
          {["daily","weekly","monthly"].map(m=>(
            <button key={m} className={`vt ${viewMode===m?"active":""}`} onClick={()=>setViewMode(m)}>
              {m.charAt(0).toUpperCase()+m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Show the right view */}
      {viewMode==="daily" && (
        <div className="card">
          <div className="card-label" style={{marginBottom:14}}>All Meter Readings (Daily View)</div>
          {computed.length===0&&<EmptyState msg="No readings yet." />}
          <div className="tbl-wrap">
            <table>
              <thead><tr>
                <th>Date</th><th>Time</th><th>Meter Unit</th><th>Used</th><th>Cost</th><th>Appliances</th><th>Note</th><th>Proof</th><th></th>
              </tr></thead>
              <tbody>{computed.map(e=>(
                <tr key={e.id}>
                  <td className="mono" style={{fontSize:12}}>{e.date}</td>
                  <td className="mono muted" style={{fontSize:12}}>{e.time}</td>
                  <td className="mono cyan" style={{fontWeight:500}}>{fmtNum(e.unit,2)}</td>
                  <td>{e.used>0?<span className="green mono">{fmtNum(e.used,2)} kWh</span>:<span className="muted">—</span>}</td>
                  <td>{e.used>0?<span className="amber">{fmtLKR(e.used*rate)}</span>:<span className="muted">—</span>}</td>
                  <td>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                      {(e.appliances||[]).slice(0,2).map((a,i)=><span key={i} className="ap-tag" style={{fontSize:10,padding:"2px 7px"}}>{a}</span>)}
                      {(e.appliances||[]).length>2&&<span className="muted" style={{fontSize:11}}>+{e.appliances.length-2}</span>}
                    </div>
                  </td>
                  <td style={{maxWidth:160,fontSize:12,color:"var(--muted)"}}>{e.note||"—"}</td>
                  <td>
                    {e.imgData
                      ? <img src={e.imgData} alt="proof" style={{width:44,height:34,objectFit:"cover",borderRadius:4,cursor:"pointer",border:"1px solid var(--border)"}} onClick={()=>window.open(e.imgData)} />
                      : <span className="muted" style={{fontSize:12}}>—</span>}
                  </td>
                  <td><button className="btn-ghost" onClick={()=>setDelId(e.id)}>🗑</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode==="weekly" && <WeeklyDetailView entries={computed} rate={rate} />}
      {viewMode==="monthly" && <MonthlyTable entries={withUsed(data.entries)} rate={rate} payments={data.payments} />}

      {delId&&(
        <div className="modal-bg">
          <div className="modal">
            <div className="modal-title">Delete this reading?</div>
            <div className="modal-body">This action cannot be undone. The reading will be permanently removed.</div>
            <div className="modal-actions">
              <button className="btn btn-outline" style={{flex:1}} onClick={()=>setDelId(null)}>Cancel</button>
              <button className="btn btn-danger" style={{flex:1}} onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WeeklyDetailView({ entries, rate }) {
  // Group entries by week, then show per-day breakdown inside each week group
  const byWeek = {};
  entries.forEach(e=>{
    const ws=weekStart(e.date);
    if(!byWeek[ws]) byWeek[ws]={ws,we:weekEnd(ws),days:{}};
    if(!byWeek[ws].days[e.date]) byWeek[ws].days[e.date]={date:e.date,units:0,entries:[]};
    byWeek[ws].days[e.date].units+=e.used;
    byWeek[ws].days[e.date].entries.push(e);
  });

  const weeks=Object.values(byWeek).sort((a,b)=>b.ws.localeCompare(a.ws));

  return (
    <div>
      {weeks.length===0&&<div className="card"><EmptyState msg="No weekly data yet." /></div>}
      {weeks.map(w=>{
        const days=Object.values(w.days).sort((a,b)=>b.date.localeCompare(a.date));
        const totalUnits=days.reduce((s,d)=>s+d.units,0);
        const startUnit=Math.min(...w.days[Object.keys(w.days).sort()[0]]?.entries.map(e=>parseFloat(e.unit||0))||[0]);
        const endUnit=Math.max(...w.days[Object.keys(w.days).sort().pop()]?.entries.map(e=>parseFloat(e.unit||0))||[0]);
        return (
          <div key={w.ws} className="week-group">
            <div className="week-group-hdr">
              <div className="week-group-title">📅 Week: {shortDate(w.ws)} – {shortDate(w.we)}</div>
              <div className="week-group-stats">
                <div className="wgs-item">
                  <span className="wgs-label">Start Unit</span>
                  <span className="wgs-val muted">{fmtNum(startUnit,1)}</span>
                </div>
                <div className="wgs-item">
                  <span className="wgs-label">End Unit</span>
                  <span className="wgs-val muted">{fmtNum(endUnit,1)}</span>
                </div>
                <div className="wgs-item">
                  <span className="wgs-label">Total Used</span>
                  <span className="wgs-val cyan">{fmtNum(totalUnits,2)} kWh</span>
                </div>
                <div className="wgs-item">
                  <span className="wgs-label">Total Cost</span>
                  <span className="wgs-val green">{fmtLKR(totalUnits*rate)}</span>
                </div>
              </div>
            </div>
            <div className="card" style={{padding:"0",borderRadius:"0 0 var(--r) var(--r)"}}>
              <div className="tbl-wrap">
                <table>
                  <thead><tr>
                    <th>Day</th><th>Units Used</th><th>Cost</th><th>Appliances</th><th>Note</th>
                  </tr></thead>
                  <tbody>{days.map(d=>(
                    <tr key={d.date}>
                      <td style={{fontWeight:600}}>{d.date} <span className="muted" style={{fontSize:11,fontWeight:400}}>({new Date(d.date).toLocaleDateString("en-LK",{weekday:"short"})})</span></td>
                      <td><span className="cyan mono">{fmtNum(d.units,2)} kWh</span></td>
                      <td className="green">{fmtLKR(d.units*rate)}</td>
                      <td>
                        {[...new Set(d.entries.flatMap(e=>e.appliances||[]))].slice(0,3).map((a,i)=>(
                          <span key={i} className="ap-tag" style={{fontSize:10,padding:"2px 7px",marginRight:3}}>{a}</span>
                        ))}
                      </td>
                      <td className="muted" style={{fontSize:12}}>{d.entries.find(e=>e.note)?.note||"—"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: PAYMENTS
═══════════════════════════════════════════════════════════════ */
function PagePayments({ data, rate, upsertPayment, showToast, toggleMenu }) {
  const blank = { month:new Date().toISOString().slice(0,7), lastUnits:"", billAmount:"", paidAmount:"", paid:false, bank:"", payeeName:"", payeeAccount:"", note:"" };
  const [form, setForm] = useState(blank);

  const setF=(k,v)=>setForm(f=>({...f,[k]:v}));

  const loadMonth = (month) => {
    const existing=data.payments.find(p=>p.month===month);
    if(existing) setForm({...existing});
    else setForm({...blank, month});
  };

  // Auto-fill units from entries
  const autoFill = () => {
    const monthEntries=withUsed(data.entries).filter(e=>e.date.startsWith(form.month));
    const totalUnits=monthEntries.reduce((s,e)=>s+e.used,0);
    setF("lastUnits",fmtNum(totalUnits,2));
    setF("billAmount",fmtNum(totalUnits*rate,2));
  };

  const submit = () => {
    if(!form.month){ showToast("Select a month","warn"); return; }
    upsertPayment({...form, id:Date.now()});
    showToast("💳 Payment record saved!");
  };

  const payments=[...data.payments].sort((a,b)=>b.month.localeCompare(a.month));

  return (
    <div>
      <div className="ph">
        <div className="ph-left">
          <button className="hamburger" onClick={toggleMenu}>☰</button>
          <div className="pt">Payment Records</div>
          <div className="ps">Track monthly bill payments and bank details</div>
        </div>
      </div>

      <div className="grid2">
        {/* Form */}
        <div className="card">
          <div className="form-title">Add / Update Payment</div>

          <div className="form-block">
            <div className="row2">
              <div className="fg">
                <label>Billing Month</label>
                <input type="month" value={form.month} onChange={e=>{ setF("month",e.target.value); loadMonth(e.target.value); }} />
              </div>
              <div className="fg" style={{justifyContent:"flex-end"}}>
                <label>&nbsp;</label>
                <button className="btn btn-outline btn-sm" onClick={autoFill} style={{alignSelf:"flex-end"}}>⚡ Auto-fill from readings</button>
              </div>
            </div>
          </div>

          <div className="form-block">
            <div className="row2">
              <div className="fg">
                <label>Units Consumed (kWh)</label>
                <input type="number" placeholder="e.g. 180.50" value={form.lastUnits} onChange={e=>setF("lastUnits",e.target.value)} />
              </div>
              <div className="fg">
                <label>Bill Amount (LKR)</label>
                <input type="number" placeholder="e.g. 5400.00" value={form.billAmount} onChange={e=>setF("billAmount",e.target.value)} style={{color:"var(--amber)"}} />
              </div>
            </div>
          </div>

          <div className="form-block">
            <div className="fg" style={{marginBottom:14}}>
              <label>Amount Paid (LKR)</label>
              <input type="number" placeholder="e.g. 5400.00" value={form.paidAmount} onChange={e=>setF("paidAmount",e.target.value)} style={{color:"var(--green)"}} />
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <input type="checkbox" id="paidChk" checked={form.paid} onChange={e=>setF("paid",e.target.checked)} />
              <label htmlFor="paidChk" style={{cursor:"pointer",fontSize:13,textTransform:"none",letterSpacing:"normal"}}>Payment completed ✅</label>
            </div>
          </div>

          {form.paid && (
            <div className="form-block">
              <div className="form-title">Bank / Transfer Details</div>
              <div className="fg" style={{marginBottom:10}}>
                <label>Bank Name</label>
                <input placeholder="e.g. Commercial Bank" value={form.bank} onChange={e=>setF("bank",e.target.value)} />
              </div>
              <div className="row2">
                <div className="fg">
                  <label>Paid To (Name)</label>
                  <input placeholder="e.g. CEB Office" value={form.payeeName} onChange={e=>setF("payeeName",e.target.value)} />
                </div>
                <div className="fg">
                  <label>Payee Account No.</label>
                  <input placeholder="e.g. 123456789" className="mono" value={form.payeeAccount} onChange={e=>setF("payeeAccount",e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <div className="fg" style={{marginBottom:16}}>
            <label>Notes</label>
            <textarea placeholder="Any notes about this payment…" value={form.note} onChange={e=>setF("note",e.target.value)} style={{minHeight:60}} />
          </div>

          <button className="btn btn-primary btn-full" onClick={submit}>💾 Save Payment Record</button>
        </div>

        {/* History */}
        <div className="card">
          <div className="form-title">Payment History</div>
          {payments.length===0&&<EmptyState msg="No payments recorded yet." />}
          {payments.map((p,i)=>(
            <div key={p.month} className="pay-item" onClick={()=>{setForm({...blank,...p});}} style={{cursor:"pointer"}}>
              <div className="pay-top">
                <div className="pay-month">{monthLabel(p.month)}</div>
                <span className={`badge ${p.paid?"badge-green":"badge-red"}`}>{p.paid?"✅ Paid":"⏳ Pending"}</span>
              </div>
              <div className="pay-detail">
                {p.lastUnits&&<div>Units: <strong style={{color:"var(--cyan)"}}>{p.lastUnits} kWh</strong></div>}
                {p.billAmount&&<div>Bill: <strong style={{color:"var(--amber)"}}>{fmtLKR(p.billAmount)}</strong></div>}
                {p.paidAmount&&<div>Paid: <strong style={{color:"var(--green)"}}>{fmtLKR(p.paidAmount)}</strong></div>}
                {p.paid&&p.bank&&<div>Via: {p.bank} → {p.payeeName} ({p.payeeAccount})</div>}
                {p.note&&<div style={{fontStyle:"italic"}}>{p.note}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIInsights({ data, settings, showToast }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);

  const getAIAnalysis = async () => {
    if (!settings.aiKey) {
      showToast("Please add your Gemini API Key in Settings first", "warn");
      return;
    }
    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(settings.aiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const usageData = withUsed(data.entries).slice(-10).map(e => ({
        date: e.date,
        used: e.used,
        appliances: e.appliances
      }));

      const prompt = `Analyze this electricity usage data for a home in Sri Lanka: ${JSON.stringify(usageData)}. 
      Provide a concise 3-bullet point analysis on energy saving tips. 
      Keep it practical and specific to the data. Format as markdown bullets.`;

      const result = await model.generateContent(prompt);
      setInsight(result.response.text());
    } catch (err) {
      showToast("AI analysis failed: " + err.message, "warn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{marginBottom: 20, border:"1px solid var(--purple)"}}>
      <div className="card-label" style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <span>🔮 AI Smart Insights</span>
        <button className="btn btn-primary btn-sm" onClick={getAIAnalysis} disabled={loading}>
          {loading ? "Analyzing..." : "Regenerate Tips"}
        </button>
      </div>
      <div style={{marginTop: 14, fontSize: 13, lineHeight: 1.6, color: "var(--text)"}}>
        {insight ? (
          <div className="ai-content" style={{whiteSpace:"pre-wrap"}}>{insight}</div>
        ) : (
          <div style={{color:"var(--muted)", fontStyle:"italic"}}>Click "Regenerate Tips" to analyze your recent consumption patterns.</div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: FORECAST
═══════════════════════════════════════════════════════════════ */
function PageForecast({ data, rate, toggleMenu, showToast }) {
  const settings = data.settings;
  const computed=withUsed(data.entries);
  const today=todayStr();

  // last 30 days
  const cut=new Date(); cut.setDate(cut.getDate()-30);
  const recent=computed.filter(e=>new Date(e.date)>=cut);
  const recentTotal=recent.reduce((s,e)=>s+e.used,0);
  const recentDays=[...new Set(recent.map(e=>e.date))].length||1;
  const avgPerDay=recentTotal/recentDays;

  const forecast30=avgPerDay*30;
  const min30=forecast30*0.75;
  const max30=forecast30*1.35;

  // per-month history
  const byMonth={};
  computed.forEach(e=>{
    const mk=e.date.slice(0,7);
    if(!byMonth[mk]) byMonth[mk]={mk,units:0};
    byMonth[mk].units+=e.used;
  });
  const months=Object.values(byMonth).sort((a,b)=>a.mk.localeCompare(b.mk));

  const maxMonthU=Math.max(...months.map(m=>m.units),0.1);

  // appliance usage frequency
  const apCount={};
  data.entries.forEach(e=>(e.appliances||[]).forEach(a=>{ apCount[a]=(apCount[a]||0)+1; }));
  const topAp=Object.entries(apCount).sort((a,b)=>b[1]-a[1]).slice(0,8);

  return (
    <div>
      <div className="ph">
        <div className="ph-left">
          <button className="hamburger" onClick={toggleMenu}>☰</button>
          <div className="pt">Forecast & Analytics</div>
          <div className="ps">Predicted next month bill & usage trends</div>
        </div>
      </div>
      <AIInsights data={data} settings={settings} showToast={showToast} />
      <div className="grid3">
        <Stat label="Avg Daily Usage" val={`${fmtNum(avgPerDay,2)} kWh`} sub="Based on last 30 days" color="" />
        <Stat label="Next 30-Day Forecast" val={`${fmtNum(forecast30,1)} kWh`} sub={fmtLKR(forecast30*rate)} color="a" />
        <Stat label="Rate Applied" val={`LKR ${rate}`} sub="per kWh" color="g" />
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div className="card-label" style={{marginBottom:16}}>Forecast Bill Range — Next Month</div>

        <div className="fc-row">
          <div className="fc-head">
            <span className="fc-lbl">🟢 Minimum (best case — 25% savings)</span>
            <strong style={{color:"var(--green)"}}>{fmtLKR(min30*rate)}</strong>
          </div>
          <div className="fc-bg"><div className="fc-fill" style={{width:"60%",background:"linear-gradient(90deg,var(--green),#059669)"}} /></div>
        </div>

        <div className="fc-row">
          <div className="fc-head">
            <span className="fc-lbl">🟡 Expected (trend-based)</span>
            <strong style={{color:"var(--amber)"}}>{fmtLKR(forecast30*rate)}</strong>
          </div>
          <div className="fc-bg"><div className="fc-fill" style={{width:"80%",background:"linear-gradient(90deg,var(--cyan),var(--amber))"}} /></div>
        </div>

        <div className="fc-row">
          <div className="fc-head">
            <span className="fc-lbl">🔴 Maximum (high-use scenario +35%)</span>
            <strong style={{color:"var(--red)"}}>{fmtLKR(max30*rate)}</strong>
          </div>
          <div className="fc-bg"><div className="fc-fill" style={{width:"100%",background:"linear-gradient(90deg,var(--amber),var(--red))"}} /></div>
        </div>
      </div>

      <div className="grid2">
        {/* Monthly trend */}
        <div className="card">
          <div className="card-label" style={{marginBottom:14}}>Monthly Usage Trend (kWh)</div>
          {months.length===0&&<EmptyState msg="No data yet." />}
          <div className="barchart" style={{height:130}}>
            {months.map((m,i)=>(
              <div key={m.mk} className="bar-col">
                {m.units>0&&<div className="bar-val">{fmtNum(m.units,0)}</div>}
                <div className="bar-body" style={{height:`${Math.max((m.units/maxMonthU)*100,m.units>0?6:2)}px`,background:"linear-gradient(180deg,var(--purple),rgba(167,139,250,.3))"}} />
                <div className="bar-lbl" style={{fontSize:9}}>{new Date(m.mk+"-01").toLocaleDateString("en-LK",{month:"short"})}</div>
              </div>
            ))}
          </div>
          {months.length>=2&&(
            <div className="tbl-wrap" style={{marginTop:12}}>
              <table>
                <thead><tr><th>Month</th><th>Units</th><th>Est. Bill</th><th>vs Prev</th></tr></thead>
                <tbody>{months.slice().reverse().map((m,i,arr)=>{
                  const prev=arr[i+1];
                  const diff=prev?m.units-prev.units:null;
                  return (
                    <tr key={m.mk}>
                      <td style={{fontSize:12}}>{monthLabel(m.mk)}</td>
                      <td className="mono cyan">{fmtNum(m.units,1)}</td>
                      <td className="amber">{fmtLKR(m.units*rate)}</td>
                      <td>{diff!==null?<span style={{color:diff>0?"var(--red)":"var(--green)",fontFamily:"var(--mono)",fontSize:12}}>{diff>0?"▲":"▼"}{fmtNum(Math.abs(diff),1)}</span>:"—"}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top appliances */}
        <div className="card">
          <div className="card-label" style={{marginBottom:14}}>Most Used Appliances</div>
          {topAp.length===0&&<EmptyState msg="Log appliances when recording readings to see usage patterns." />}
          {topAp.map(([a,count],i)=>(
            <div key={a} style={{marginBottom:12}}>
              <div className="fc-head">
                <span style={{fontSize:12}}>{a}</span>
                <span className="badge badge-cyan">{count} readings</span>
              </div>
              <div className="fc-bg" style={{height:7}}>
                <div className="fc-fill" style={{width:`${(count/topAp[0][1])*100}%`,background:`hsl(${190+i*20},80%,55%)`}} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: SETTINGS
═══════════════════════════════════════════════════════════════ */
function PageSettings({ settings, updateSettings, showToast, onClear, toggleMenu }) {
  const [form, setForm] = useState({...settings});
  const setF=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=()=>{ updateSettings(form); showToast("⚙️ Settings saved!"); };

  return (
    <div>
      <div className="ph">
        <div className="ph-left">
          <button className="hamburger" onClick={toggleMenu}>☰</button>
          <div className="pt">Settings</div>
          <div className="ps">Configure your ECB account and billing rate</div>
        </div>
      </div>

      <div className="settings-wrap">
        <div className="card" style={{marginBottom:16}}>
          <div className="form-title">🏠 Account Details</div>
          <div className="fg" style={{marginBottom:14}}>
            <label>ECB Account Number</label>
            <input className="mono" placeholder="e.g. 1234567890" value={form.accountNumber} onChange={e=>setF("accountNumber",e.target.value)} />
          </div>
          <div className="fg" style={{marginBottom:14}}>
            <label>Account Owner Name</label>
            <input placeholder="e.g. Sathsara Perera" value={form.ownerName} onChange={e=>setF("ownerName",e.target.value)} />
          </div>
          <div className="form-title" style={{marginTop:20}}>🧠 AI Configuration</div>
          <div className="fg" style={{marginBottom:14}}>
            <label>Gemini API Key</label>
            <input type="password" placeholder="Paste your Gemini API key here" value={form.aiKey||""} onChange={e=>setF("aiKey",e.target.value)} />
            <div style={{fontSize:10,color:"var(--muted)",marginTop:4}}>Get a key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{color:"var(--cyan)"}}>Google AI Studio</a></div>
          </div>
          <div className="form-title" style={{marginTop:20}}>💰 Billing Rate</div>
          <div className="fg" style={{marginBottom:6}}>
            <label>LKR per Unit (kWh)</label>
            <input type="number" step="0.01" min="0" placeholder="e.g. 30.00" value={form.lkrPerUnit} onChange={e=>setF("lkrPerUnit",e.target.value)} style={{fontFamily:"var(--mono)",fontSize:24,fontWeight:500,color:"var(--green)"}} />
          </div>
          <div style={{fontSize:11,color:"var(--muted)",marginBottom:16}}>Check your latest CEB bill for the current tariff rate</div>
          <button className="btn btn-primary" onClick={save}>💾 Save Settings</button>
        </div>

        <div className="card" style={{borderColor:"rgba(255,77,106,.2)"}}>
          <div className="form-title" style={{color:"var(--red)"}}>🔒 Account</div>
          <button className="btn btn-outline" style={{width:"100%", marginBottom: 20}} onClick={() => supabase.auth.signOut()}>
            🚪 Log Out
          </button>

          <div className="form-title" style={{color:"var(--red)"}}>⚠️ Danger Zone</div>
          <div style={{fontSize:13,color:"var(--muted)",marginBottom:14}}>Permanently delete all meter readings, payments, and data. This cannot be undone.</div>
          <button className="btn btn-danger" onClick={()=>{ if(window.confirm("Delete ALL data? This cannot be undone.")) onClear(); }}>
            🗑️ Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: REPORTS
═══════════════════════════════════════════════════════════════ */
function PageReports({ data, rate, toggleMenu }) {
  const [range, setRange] = useState("thisMonth");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const filtered = withUsed(data.entries).filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    if (range === "thisMonth") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (range === "lastMonth") {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    }
    if (range === "custom") return (!start || e.date >= start) && (!end || e.date <= end);
    return true;
  });

  const exportToExcel = () => {
    const wsData = filtered.map(e => ({
      Date: e.date,
      Time: e.time,
      "Meter Unit (kWh)": e.unit,
      "Used (kWh)": e.used,
      "Cost (LKR)": e.used * rate,
      Note: e.note || ""
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Electricity Report");
    XLSX.writeFile(wb, `ECB_Report_${range}_${todayStr()}.xlsx`);
  };

  return (
    <div>
      <div className="ph">
        <div className="ph-left">
          <button className="hamburger" onClick={toggleMenu}>☰</button>
          <div className="pt">Usage Reports</div>
          <div className="ps">Generate and export consumption reports</div>
        </div>
      </div>

      <div className="card" style={{marginBottom: 20}}>
        <div className="row3" style={{alignItems:"flex-end"}}>
          <div className="fg">
            <label>Report Range</label>
            <select value={range} onChange={e=>setRange(e.target.value)}>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="all">All Records</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {range === "custom" && (
            <>
              <div className="fg">
                <label>Start Date</label>
                <input type="date" value={start} onChange={e=>setStart(e.target.value)} />
              </div>
              <div className="fg">
                <label>End Date</label>
                <input type="date" value={end} onChange={e=>setEnd(e.target.value)} />
              </div>
            </>
          )}
          <button className="btn btn-primary" onClick={exportToExcel} style={{height:42}}>📥 Export to Excel</button>
        </div>
      </div>

      <div className="card">
        <div className="card-label">Report Preview ({filtered.length} entries)</div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Date</th><th>Unit</th><th>Used</th><th>Cost</th><th>Note</th></tr></thead>
            <tbody>{filtered.map(e=>(
              <tr key={e.id}>
                <td className="mono" style={{fontSize:12}}>{e.date}</td>
                <td className="mono cyan">{fmtNum(e.unit,1)}</td>
                <td className="green">{fmtNum(e.used,2)} kWh</td>
                <td className="amber">{fmtLKR(e.used*rate)}</td>
                <td className="muted" style={{fontSize:11}}>{e.note||"—"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHARED
═══════════════════════════════════════════════════════════════ */
function EmptyState({ msg }) {
  return (
    <div className="empty">
      <div className="empty-icon">📭</div>
      <div className="empty-msg">{msg}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LOGIN SCREEN
═══════════════════════════════════════════════════════════════ */
function LoginScreen({ showToast }) {
  const [view, setView] = useState("login"); // login | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // New Signup Fields
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { showToast("Enter email and password", "warn"); return; }
    if (!isLogin && (!username || !mobile || !accountNumber || !confirmPassword)) {
      showToast("Please fill in all profile fields", "warn");
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      showToast("Passwords do not match", "warn");
      return;
    }
    
    setLoading(true);
    let error = null;
    
    if (view === "login") {
      const res = await supabase.auth.signInWithPassword({ email, password });
      error = res.error;
    } else if (view === "signup") {
      const res = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            username: username,
            mobile: mobile,
            account_number: accountNumber
          }
        }
      });
      error = res.error;
      
      if (!error && res.data.user) {
        // Create user profile in the public.profiles table
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: res.data.user.id,
            email: email,
            username: username,
            mobile: mobile,
            account_number: accountNumber
          }
        ]);
        if (profileError) {
          error = profileError;
        } else {
          // Immediately log in since email confirmation is disabled
          const loginRes = await supabase.auth.signInWithPassword({ email, password });
          if (loginRes.error) {
            error = loginRes.error;
          } else {
            showToast("Sign up successful! Logging in...", "ok");
          }
        }
      }
    }
    setLoading(false);
    if (error) {
      if (error.status === 429) {
        showToast("Too many attempts. Please wait 5 minutes and try again.", "warn");
      } else {
        showToast(error.message, "warn");
      }
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) { showToast("Enter your email address", "warn"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    setLoading(false);
    if (error) showToast(error.message, "warn");
    else showToast("Password reset email sent! Check your inbox.", "ok");
  };

  return (
    <div style={{display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding: 20}}>
      <div className="card" style={{width: 360, maxWidth: "100%"}}>
        <div className="brand" style={{borderBottom:"none", padding:"0 0 20px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center"}}>
          <img src="/assets/logo.png" alt="ECB Tracker Logo" style={{maxWidth:"150px", maxHeight:"60px", objectFit:"contain"}} />
          <div className="brand-sub" style={{marginTop:"8px"}}>Secure Login</div>
        </div>
        <form onSubmit={view === "forgot" ? handleReset : handleSubmit}>
          {view === "signup" && (
            <>
              <div className="fg" style={{marginBottom: 16}}>
                <label>Username</label>
                <input type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="e.g. Sathsara" required={view === "signup"} />
              </div>
              <div className="fg" style={{marginBottom: 16}}>
                <label>Mobile Number</label>
                <input type="tel" value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="e.g. +94770000000" required={!isLogin} />
              </div>
              <div className="fg" style={{marginBottom: 16}}>
                <label>CEB Account Number</label>
                <input type="text" className="mono" value={accountNumber} onChange={e=>setAccountNumber(e.target.value)} placeholder="e.g. 1234567890" required={view === "signup"} />
              </div>
            </>
          )}

          {view !== "forgot" && (
            <div className="fg" style={{marginBottom: view === "login" ? 24 : 16}}>
              <label>Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
              {view === "login" && (
                <div style={{textAlign: "right", marginTop: 4}}>
                  <span style={{fontSize: 12, color: "var(--cyan)", cursor: "pointer"}} onClick={() => setView("forgot")}>Forgot Password?</span>
                </div>
              )}
            </div>
          )}
          {view === "signup" && (
            <div className="fg" style={{marginBottom: 24}}>
              <label>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="••••••••" required={view === "signup"} />
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Please wait..." : (view === "login" ? "Log In" : (view === "signup" ? "Create Account" : "Send Reset Link"))}
          </button>
        </form>
        <div style={{textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--muted)"}}>
          {view === "login" ? "Don't have an account? " : (view === "signup" ? "Already have an account? " : "Go back to ")}
          <span style={{color: "var(--cyan)", cursor: "pointer", fontWeight: 600}} onClick={() => setView(view === "signup" ? "login" : (view === "forgot" ? "login" : "signup"))}>
            {view === "login" ? "Sign Up" : "Log In"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RESET PASSWORD SCREEN
═══════════════════════════════════════════════════════════════ */
function ResetPasswordScreen({ showToast }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { showToast("Passwords do not match", "warn"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) showToast(error.message, "warn");
    else {
      showToast("Password updated successfully!", "ok");
      window.location.hash = "";
      window.location.reload();
    }
  };

  return (
    <div style={{display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding: 20}}>
      <div className="card" style={{width: 360, maxWidth: "100%"}}>
        <div className="brand" style={{borderBottom:"none", padding:"0 0 20px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center"}}>
          <img src="/assets/logo.png" alt="ECB Tracker Logo" style={{maxWidth:"150px", maxHeight:"60px", objectFit:"contain"}} />
          <div className="brand-sub" style={{marginTop:"8px"}}>Set New Password</div>
        </div>
        <form onSubmit={handleReset}>
          <div className="fg" style={{marginBottom: 16}}>
            <label>New Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <div className="fg" style={{marginBottom: 24}}>
            <label>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
