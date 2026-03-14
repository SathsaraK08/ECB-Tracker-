# ✅ FEATURES — ECB Tracker

## COMPLETED (v1.0 — Web MVP)

### Core App
- [x] Single-file React app (ecb-tracker.jsx)
- [x] Dark theme with cyan/green/amber accent system
- [x] Sidebar navigation (6 pages)
- [x] Persistent storage (currently via Claude artifact API)
- [x] Responsive layout (mobile collapses sidebar)

### Log Reading Page
- [x] Date picker (defaults to today, blocks future dates)
- [x] Time field with "Now" auto-fill button + manual entry
- [x] Meter unit input (large prominent field)
- [x] Live diff preview — "X kWh since last reading = LKR Y"
- [x] Meter photo upload (base64 stored as proof)
- [x] Appliance preset toggle buttons (12 presets)
- [x] Custom appliance entry (type + Enter or + Add)
- [x] Notes textarea
- [x] Save to persistent storage

### Dashboard Page
- [x] Daily / Weekly / Monthly toggle tabs
- [x] 4 stat cards (Today, This Week, This Month, Rate)
- [x] 7-day usage bar chart (pure CSS, no canvas library)
- [x] Daily table: date, units, cost, readings count, appliances, notes
- [x] Weekly table: week range, start unit, end unit, total units, cost, avg/day, days logged
- [x] Monthly table: month, units, estimated bill, payment status, days logged

### Records Page
- [x] Same Daily/Weekly/Monthly toggle
- [x] Daily: all individual readings, proof thumbnails, delete with confirm modal
- [x] Weekly: grouped week blocks with per-day row breakdown inside
- [x] Monthly: full monthly summary table
- [x] View switches completely when tab changes

### Payments Page
- [x] Month selector
- [x] Units consumed input + Bill amount input
- [x] Amount paid input
- [x] Payment done / pending checkbox
- [x] Bank name, Payee name, Payee account number (shown only when paid)
- [x] "Auto-fill from readings" button
- [x] Notes field
- [x] Full payment history (click to reload into form)
- [x] Update existing records (not duplicate)

### Forecast Page
- [x] Average daily usage from last 30 days
- [x] 30-day projected units + bill cost
- [x] Min / Expected / Max forecast range with visual bars
- [x] Monthly trend bar chart (with ▲▼ comparison)
- [x] Most-used appliances frequency tracker with bars

### Settings Page
- [x] ECB Account Number
- [x] Owner Name
- [x] LKR per unit rate
- [x] Clear all data (with confirmation)

---

## PLANNED — Next Phase (v1.1)

### High Priority
- [ ] **Replace window.storage with localStorage** (for real React / Android build)
- [ ] **package.json + index.html** scaffold for standalone React app
- [ ] **Capacitor Android build** — generate APK
- [ ] **App icon + splash screen** (ECB Tracker branding)
- [ ] **PWA manifest** — installable from browser as free alternative

### Medium Priority
- [ ] **CEB Tiered Tariff Calculator** — Sri Lanka CEB uses block pricing:
  - 0–30 units: LKR 7.85/unit
  - 31–60 units: LKR 10.00/unit
  - 61–90 units: LKR 27.75/unit
  - 91–120 units: LKR 32.00/unit
  - 121–180 units: LKR 45.00/unit
  - 181+ units: LKR 50.00/unit
  *(rates subject to change — user should be able to edit these)*
- [ ] **Export to PDF/CSV** — monthly bill report download
- [ ] **Bill reminder notifications** (using Capacitor local notifications)
- [ ] **Multi-meter / multi-room support** — track by room or meter ID

### Future (v2.0)
- [ ] **Gemini AI integration** — paste API key, AI analyzes patterns and gives saving tips
- [ ] **Google Drive sync** — backup data to cloud
- [ ] **Chart library** — replace CSS bars with proper line charts (recharts or Chart.js)
- [ ] **Widget** — Android home screen widget showing today's usage
- [ ] **Google Play release** — proper signing, store listing, screenshots

---

## GOOGLE PLAY CHECKLIST (when ready)

- [ ] Google Play Developer account ($25 USD one-time fee)
- [ ] App signed with release keystore (`keytool -genkey ...`)
- [ ] Release APK / AAB built (`./gradlew bundleRelease`)
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] Screenshots (2+ phone screenshots)
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars max)
- [ ] Privacy Policy URL (required — even for local-only apps)
- [ ] Category: Finance or Utilities
- [ ] Target SDK: 34+ (Android 14)
- [ ] Content rating questionnaire completed
