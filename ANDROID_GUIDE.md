# 📱 Android APK Guide — ECB Tracker

> Convert the React web app into an installable Android APK using **Capacitor**  
> This gives you a real `.apk` file you can install on any Android phone **without Google Play**

---

## METHOD: React + Capacitor → Android APK

Capacitor wraps your React web app in a native Android WebView. It is:
- ✅ Free to use
- ✅ Works in Google IDX (has Android SDK)
- ✅ Generates a real `.apk` you can sideload
- ✅ Later publishable to Google Play with the same codebase

---

## STEP 1 — Set Up React Project in IDX

Open Terminal in IDX and run:

```bash
# Create React app
npx create-react-app ecb-tracker
cd ecb-tracker

# Delete the default src files
rm src/App.js src/App.css src/App.test.js src/logo.svg src/reportWebVitals.js src/setupTests.js
```

Now copy your `ecb-tracker.jsx` into `src/` and edit `src/index.js`:

```javascript
// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './ecb-tracker';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

---

## STEP 2 — Fix Storage (CRITICAL)

Open `ecb-tracker.jsx` and replace the two storage functions at the top:

```javascript
// REMOVE THIS (Claude artifact storage):
const persist = async (data) => { try { await window.storage.set(SKEY, JSON.stringify(data)); } catch {} };
const hydrate = async () => { try { const r = await window.storage.get(SKEY); return r ? JSON.parse(r.value) : null; } catch { return null; } };

// REPLACE WITH THIS (localStorage — works in browser + Android WebView):
const persist = async (data) => {
  try { localStorage.setItem(SKEY, JSON.stringify(data)); } catch(e) {}
};
const hydrate = async () => {
  try {
    const raw = localStorage.getItem(SKEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
};
```

---

## STEP 3 — Test in Browser First

```bash
npm start
```

Open `http://localhost:3000` — the app should be fully functional. Test all pages before continuing.

---

## STEP 4 — Build Production Bundle

```bash
npm run build
```

This creates a `build/` folder with optimized HTML/CSS/JS.

---

## STEP 5 — Install Capacitor

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init "ECB Tracker" "com.sathsara.ecbtracker" --web-dir build

# Install Android platform
npm install @capacitor/android
npx cap add android
```

---

## STEP 6 — Sync and Open Android Project

```bash
# Sync web build into Android project
npm run build
npx cap sync android

# Open Android project (in IDX this may open Android Studio or you can build from CLI)
npx cap open android
```

---

## STEP 7 — Build the APK

### Option A — In Android Studio (if IDX opens it):
1. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option B — From Terminal (no Android Studio needed):
```bash
cd android
./gradlew assembleDebug
```
APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## STEP 8 — Install APK on Your Android Phone

### Method 1 — USB
```bash
# Enable USB Debugging on phone first (Developer Options)
adb devices                    # confirm phone is connected
adb install app-debug.apk
```

### Method 2 — Transfer file
1. Copy `app-debug.apk` to your phone via USB / Google Drive / WhatsApp
2. On phone: tap the file → "Install anyway" (allow unknown sources)
3. Find **ECB Tracker** in your app drawer ✅

---

## STEP 9 — App Icon & Name (Optional but recommended)

Replace the default Capacitor icon:

```bash
# Install icon generator
npm install -g cordova-res

# Create a 1024x1024 icon.png and put in resources/
mkdir resources
# add resources/icon.png (1024x1024)
# add resources/splash.png (2732x2732)

cordova-res android --skip-config --copy
npx cap sync android
```

---

## capacitor.config.ts (full config)

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sathsara.ecbtracker',
  appName: 'ECB Tracker',
  webDir: 'build',
  bundledWebRuntime: false,
  android: {
    allowMixedContent: true,
    backgroundColor: '#07090f',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#07090f',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;
```

---

## TROUBLESHOOTING

| Problem | Fix |
|---------|-----|
| `gradlew: Permission denied` | Run `chmod +x android/gradlew` |
| Build fails — SDK not found | In IDX: check Android SDK is installed in Extensions |
| Images not showing in APK | Add `allowMixedContent: true` in capacitor config |
| App crashes on launch | Check browser console in Chrome DevTools (chrome://inspect) |
| Storage not persisting | Confirm you replaced `window.storage` with `localStorage` |

---

## UNTIL GOOGLE PLAY — Distribution Options

While you save up for Google Play ($25 one-time fee), share the APK:

| Method | How |
|--------|-----|
| **Direct APK** | Share `.apk` file via WhatsApp/Telegram/Drive — install manually |
| **GitHub Releases** | Upload APK to GitHub → share download link |
| **Firebase App Distribution** | Free Google service — distribute to testers by email |
| **APKPure / APKMirror** | Free third-party stores (no fee) |
| **Progressive Web App (PWA)** | Add to home screen from browser — works like an app, zero fee |

### PWA (Best free option — works right now!)

Add these to your React `public/manifest.json`:
```json
{
  "name": "ECB Tracker",
  "short_name": "ECB",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#07090f",
  "theme_color": "#00d4ff",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Then host on **Vercel** or **Netlify** (both free), open on phone → Chrome menu → "Add to Home Screen". Looks and feels like a native app. ✅
