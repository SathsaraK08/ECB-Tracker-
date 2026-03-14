# 🤖 PROMPT CONTEXT — Paste this into Claude Sonnet to resume work

---

## HOW TO USE THIS FILE

Copy everything below the line `=== PASTE FROM HERE ===` and paste it as your **first message** to Claude Sonnet in Google IDX (or any Claude interface). This gives Claude full context to continue building without starting over.

---

=== PASTE FROM HERE ===

I am building an **ECB Electricity Tracker** — a personal electricity bill tracker Android app for Sri Lanka. I have already built a working React web app (single JSX file). I need you to help me continue building it.

---

## WHAT HAS ALREADY BEEN BUILT

A complete single-file React app (`ecb-tracker.jsx`) with the following fully working features:

### ✅ Sidebar Navigation
- 6 pages: Dashboard, Log Reading, Records, Payments, Forecast, Settings
- Shows ECB account number and LKR/unit rate at bottom
- Responsive (collapses on mobile)

### ✅ Log Reading Page (`PageLog`)
- Date picker (defaults to today)
- Time field that auto-fills current time when "🕐 Now" button clicked, also manually editable
- Meter unit input (large, prominent, with live diff preview vs last reading)
- Meter photo upload (proof image stored as base64)
- Appliance preset toggle buttons (AC Bedroom 1/2, Fridge, Washing Machine, etc.) + custom appliance entry
- Notes textarea
- Saves to persistent storage

### ✅ Dashboard Page (`PageDashboard`)
- Daily / Weekly / Monthly toggle tabs — CHANGES THE ENTIRE CONTENT when switched
- 4 stat cards: Today's usage, This Week, This Month, Rate
- 7-day bar chart (canvas-free, pure CSS)
- Daily view: table of consumption per day
- Weekly view: table with start unit, end unit, total units, cost, avg/day
- Monthly view: monthly summary with payment status

### ✅ Records Page (`PageRecords`)
- Same Daily/Weekly/Monthly toggle
- Daily: all individual readings with photo proof thumbnails, delete button
- Weekly: grouped week blocks showing per-day breakdown inside each week — day, units used, cost, appliances, notes
- Monthly: summary table

### ✅ Payments Page (`PagePayments`)
- Select billing month
- Enter last month units, bill amount, amount paid
- Checkbox: "Payment completed" — when checked, shows Bank Name, Paid To (Name), Payee Account Number fields
- "Auto-fill from readings" button pulls calculated units from logged data
- Payment history on right side — click to load back into form
- Tracks: paid/pending status, bank, payee name, payee account, notes

### ✅ Forecast Page (`PageForecast`)
- Calculates average daily usage from last 30 days
- Projects next 30-day units and cost
- Min / Expected / Max forecast range with visual bars
- Monthly trend bar chart
- Most-used appliances frequency tracker

### ✅ Settings Page (`PageSettings`)
- ECB Account Number
- Owner Name
- LKR per Unit (kWh rate)
- Clear all data button

---

## DATA MODEL

```javascript
// Single entry (one meter reading)
{
  id: 1234567890,          // Date.now()
  date: "2026-03-13",      // YYYY-MM-DD
  time: "14:30",           // HH:MM
  unit: 1842.50,           // float — meter reading in kWh
  used: 3.20,              // computed — units consumed since previous reading
  note: "AC ran all day",  // string
  appliances: ["🌬️ AC – Bedroom 1", "❄️ Refrigerator"],  // array of strings
  imgData: "data:image/jpeg;base64,...",  // base64 image or null
  imgName: "meter_photo.jpg"
}

// Payment record
{
  id: 1234567890,
  month: "2026-03",        // YYYY-MM
  lastUnits: "180.50",     // string
  billAmount: "5400.00",   // string
  paidAmount: "5400.00",   // string
  paid: true,              // boolean
  bank: "Commercial Bank",
  payeeName: "CEB Office",
  payeeAccount: "123456789",
  note: "Paid via online banking"
}

// Settings
{
  accountNumber: "1234567890",
  ownerName: "Sathsara Perera",
  lkrPerUnit: "30"
}
```

---

## STORAGE (IMPORTANT — NEEDS CHANGE)

The current app uses `window.storage` which is a Claude.ai artifact-specific API:
```javascript
await window.storage.set(key, value)
await window.storage.get(key)
```

**For real React app / Android, replace with:**
```javascript
localStorage.setItem(key, value)
localStorage.getItem(key)
```

The functions to change are `persist()` and `hydrate()` at the top of the file.

---

## DESIGN SYSTEM

```css
--bg: #07090f          /* Main background */
--s1: #0d1117          /* Sidebar / card background */
--s2: #111827          /* Input background */
--s3: #1a2236          /* Hover states */
--border: #1e2d45
--cyan: #00d4ff        /* Primary accent */
--green: #00e5a0       /* Success / positive */
--amber: #f59e0b       /* Warning / cost */
--red: #ff4d6a         /* Danger */
--purple: #a78bfa      /* Secondary accent */
--text: #e2eaf5
--muted: #4a6080
--font: 'Outfit', sans-serif
--mono: 'DM Mono', monospace
```

---

## WHAT I NEED NEXT

Please help me with the following (tell me which one you want to work on):

1. **Convert to real React app** — Add `package.json`, `index.html`, replace `window.storage` with `localStorage`, make it run with `npm start`
2. **Android APK via Capacitor** — Add Capacitor, configure `capacitor.config.ts`, build APK
3. **New Feature: Gemini AI integration** — Add a chat panel where Gemini API analyzes usage patterns and gives saving tips
4. **New Feature: Multi-room tracking** — Track electricity per room/area
5. **New Feature: Tariff block calculator** — Sri Lanka CEB uses tiered pricing (0-30 units = one rate, 31-60 = another, etc.) — implement proper slab calculation
6. **Google Play preparation** — App icons, splash screen, privacy policy, store listing

---

## MY ENVIRONMENT

- IDE: Google IDX (Project IDX / Firebase Studio) — has Node.js, npm, Android SDK
- AI: Claude Sonnet (you) inside IDX
- Target: Android APK (for personal use first, Google Play later)
- Location: Colombo, Sri Lanka
- CEB Tariff: Variable — user enters LKR/unit manually

=== END OF PASTE ===
