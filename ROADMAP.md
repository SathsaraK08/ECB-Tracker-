# 🗺️ ROADMAP — ECB Tracker

## Release Plan

```
Phase 1 — Web MVP (DONE ✅)
    └── React single-file app
    └── All core features working
    └── Runs in Claude.ai artifact

Phase 2 — Real App (CURRENT TARGET)
    └── Convert to standalone React project
    └── Fix localStorage
    └── Build Android APK via Capacitor
    └── Install on own phone (sideload)
    └── Test all features on Android

Phase 3 — Free Distribution
    └── Deploy web version (Vercel/Netlify — FREE)
    └── PWA — "Add to Home Screen" installable
    └── Share APK directly (WhatsApp / Telegram / Google Drive)
    └── Optional: Firebase App Distribution (free, up to 100 testers)

Phase 4 — Google Play ($25 one-time fee)
    └── Create Google Play Developer account
    └── App signing (release keystore)
    └── Store listing: icon, screenshots, description
    └── Privacy policy page
    └── Submit for review (usually 1–3 days)
    └── Publish ✅

Phase 5 — Feature Expansion
    └── Tiered CEB tariff calculator
    └── Gemini AI cost analysis
    └── Export PDF reports
    └── Cloud backup (Google Drive)
    └── Home screen widget
```

---

## Budget Planning

| Item | Cost | When |
|------|------|------|
| Google Play Developer Account | $25 USD (~LKR 7,500) | One-time, before Phase 4 |
| Apple Developer (if iOS wanted) | $99 USD/year | Optional, future |
| Domain for Privacy Policy | ~$10/year | Before Play Store |
| Hosting (Vercel/Netlify) | FREE | Phase 3 |
| Firebase App Distribution | FREE | Phase 3 |
| Gemini API (for AI features) | Free tier available | Phase 5 |

**Minimum to publish on Google Play: ~LKR 7,500 (~$25 USD)**

---

## IDX-Specific Notes

Google IDX (Project IDX / Firebase Studio) has:
- ✅ Node.js + npm built in
- ✅ Android emulator (via Android SDK)
- ✅ `adb` for device connection
- ✅ Claude Sonnet AI assistant built in
- ✅ Git integration
- ✅ Firebase deployment

### Recommended IDX Workflow:
1. Open project in IDX
2. Paste `PROMPT_CONTEXT.md` into Claude chat in IDX
3. Ask Claude to run Step 1–4 of `ANDROID_GUIDE.md`
4. Test in Android emulator inside IDX
5. Build APK → transfer to phone
