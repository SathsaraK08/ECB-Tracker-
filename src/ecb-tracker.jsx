import { useState, useEffect, useRef, useCallback } from "react";
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

@media(max-width:860px){
  .aside{width:58px;}
  .brand-name,.brand-sub,.nav-item span,.aside-footer{display:none;}
  .nav-item{justify-content:center;padding:10px;}
  .grid4{grid-template-columns:repeat(2,1fr);}
  .grid3{grid-template-columns:repeat(2,1fr);}
  .row2,.row3{grid-template-columns:1fr;}
  .main{padding:16px;max-width:calc(100vw - 58px);}
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [data, setData] = useState(INIT);
  const [page, setPage] = useState("dashboard");
  const [viewMode, setViewMode] = useState("daily"); // daily | weekly | monthly
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);

  const [session, setSession] = useState(null);\n  const [recoveryMode, setRecoveryMode] = useState(false);

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

  if (recoveryMode) {
    return (
      <>
        <style>{CSS}</style>
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
        <ResetPasswordScreen showToast={showToast} onComplete={() => setRecoveryMode(false)} />
      </>
    );
  }

  if(!session) {
    return (
      <>
        <style>{CSS}</style>
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
        <LoginScreen showToast={showToast} />
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
        <div className={`sidebar-overlay ${isMenuOpen ? "open" : ""}`} onClick={() => setIsMenuOpen(false)} />
        <Sidebar isMenuOpen={isMenuOpen} closeMenu={() => setIsMenuOpen(false)} page={page} setPage={setPage} settings={data.settings} viewMode={viewMode} setViewMode={setViewMode} showViewToggle={["dashboard","records"].includes(page)} />
        <main className="main">
          {page==="dashboard" && <PageDashboard data={data} rate={rate} viewMode={viewMode} setViewMode={setViewMode}  toggleMenu={() => setIsMenuOpen(p=>!p)} />}
          {page==="log"       && <PageLog entries={data.entries} rate={rate} addEntry={addEntry} showToast={showToast}  toggleMenu={() => setIsMenuOpen(p=>!p)} />}
          {page==="records"   && <PageRecords data={data} rate={rate} viewMode={viewMode} setViewMode={setViewMode} deleteEntry={deleteEntry} showToast={showToast}  toggleMenu={() => setIsMenuOpen(p=>!p)} />}
          {page==="payments"  && <PagePayments data={data} rate={rate} upsertPayment={upsertPayment} showToast={showToast}  toggleMenu={() => setIsMenuOpen(p=>!p)} />}
          {page==="forecast"  && <PageForecast data={data} rate={rate}  toggleMenu={() => setIsMenuOpen(p=>!p)} />}
          {page==="settings"  && <PageSettings settings={data.settings} updateSettings={updateSettings} showToast={showToast} onClear={()=>{clearAllData();showToast("All data cleared","warn");}} />}
        </main>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════════ */
function Sidebar({ isMenuOpen, closeMenu, page, setPage, settings, viewMode, setViewMode, showViewToggle }) {
  const nav = [
    {id:"dashboard",icon:"⚡",label:"Dashboard"},
    {id:"log",icon:"📝",label:"Log Reading"},
    {id:"records",icon:"📋",label:"Records"},
    {id:"payments",icon:"💳",label:"Payments"},
    {id:"forecast",icon:"🔮",label:"Forecast"},
    {id:"settings",icon:"⚙️",label:"Settings"},
  ];
  return (
    <aside className={`aside ${isMenuOpen ? "open" : ""}`}>
      <div className="brand" style={{borderBottom:"none", padding:"0 0 20px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center"}}>
          <img src="/assets/logo.png" alt="ECB Tracker Logo" style={{maxWidth:"150px",maxHeight:"60px",objectFit:"contain"}} />
          <div className="brand-sub" style={{marginTop:"8px"}}>Secure Login</div>
        </div>
        {isForgot ? (
            <form onSubmit={async (e)=>{
              e.preventDefault();
              setLoading(true);
              const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
              setLoading(false);
              if(error) showToast(error.message, "warn");
              else { showToast("Password reset link sent!", "ok"); setIsForgot(false); }
            }}>
              <div className="fg" style={{marginBottom: 24}}>
                <label>Email Address</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? "Please wait..." : "Send Reset Link"}
              </button>
              <div style={{textAlign: "center", marginTop: 20, fontSize: 13}}>
                <span style={{color: "var(--cyan)", cursor: "pointer"}} onClick={() => setIsForgot(false)}>Back to Login</span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="fg" style={{marginBottom: 16}}>
                <label>Username</label>
                <input type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="e.g. Sathsara" required={!isLogin} />
              </div>
              <div className="fg" style={{marginBottom: 16}}>
                <label>Mobile Number</label>
                <input type="tel" value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="e.g. +94770000000" required={!isLogin} />
              </div>
              <div className="fg" style={{marginBottom: 16}}>
                <label>CEB Account Number</label>
                <input type="text" className="mono" value={accountNumber} onChange={e=>setAccountNumber(e.target.value)} placeholder="e.g. 1234567890" required={!isLogin} />
              </div>
            </>
          )}

          <div className="fg" style={{marginBottom: 16}}>
            <label>Email Address</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required />
          </div>
          <div className="fg" style={{marginBottom: 24}}>
            <label>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Please wait..." : (isLogin ? "Log In" : "Create Account")}
          </button>
        </form>
        <div style={{textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--muted)"}}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span style={{color: "var(--cyan)", cursor: "pointer", fontWeight: 600}} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign Up" : "Log In"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RESET PASSWORD SCREEN
═══════════════════════════════════════════════════════════════ */
function ResetPasswordScreen({ showToast, onComplete }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return showToast("Passwords do not match", "warn");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) showToast(error.message, "warn");
    else {
      showToast("Password updated successfully!", "ok");
      onComplete();
    }
  };

  return (
    <div style={{display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding: 20}}>
      <div className="card" style={{width: 360, maxWidth: "100%"}}>
        <div className="brand" style={{borderBottom:"none", padding:"0 0 20px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center"}}>
          <img src="/assets/logo.png" alt="ECB Tracker Logo" style={{maxWidth:"150px",maxHeight:"60px",objectFit:"contain"}} />
          <div className="brand-sub" style={{marginTop:"8px"}}>Reset Password</div>
        </div>
        <form onSubmit={handleReset}>
          <div className="fg" style={{marginBottom: 16}}>
            <label>New Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <div className="fg" style={{marginBottom: 24}}>
            <label>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
