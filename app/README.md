# 👶 NovaBaby — Smart Pediatric Health & Analytics Mobile Application

NovaBaby is an intelligent, offline-first mobile pediatric tracker designed for parents, caregivers, and pediatricians. Built with **React 19**, **TypeScript**, **Vite**, and **Capacitor**, NovaBaby packages natively for both **Apple iOS (iPhone/iPad)** and **Google Android (Pixel/Samsung)** with zero external runtime dependencies.

---

## 🌟 Key Features

* **"3 AM Nursery Rule" Offline Architecture**: 100% of features (logging, timers, sound machine, growth percentiles) work with zero network latency, persistent across device restarts.
* **🎙️ Nightstand Voice Assistant**: Hands-free voice commands (*"Hey Nova, 120 ml formula"*, *"Nova, wet diaper"*, *"Nova, next nap"*) with decoupled microphone and audible maternal chimes.
* **🌙 SweetNap™ Sleep Window AI**: Predictive wake window algorithms based on age and circadian patterns, alerting parents before overtired cortisol spikes occur.
* **🍼 Custom Formula Ratio Calculator**: Precision water-to-powder ratio calculator with saved device preferences and pediatric intake recommendations.
* **📈 WHO Growth Percentiles & Multi-Category Analytics**: Dynamic categorical dropdown filters across Feeds, Diapers, Sleep, Growth, and Milestones with instant keyword filtering.
* **📄 Clinical Pediatric Dossier Export**: One-tap structured clinical report generator formatted specifically for pediatrician well-child exams.
* **🔒 HIPAA & NIST SP 800-63B Compliant Auth**: Client-side PBKDF2-HMAC-SHA256 password hashing with brute-force lockout, rate limiting, and zero client database leaks.
* **👥 Multi-Caregiver Household Sync**: Air-gapped QR codes, 1-tap transfer strings, and real-time private relay syncing for parents, nannies, and grandparents.

---

## 🏗️ Technical Architecture

* **Frontend**: React 19, TypeScript, CSS Variables (Dark, Light, Slate, High-Contrast Red Night Vision)
* **Mobile Runtime**: Capacitor 8 (Native iOS & Android wrappers)
* **Speech Engine**: Dual-Engine (Capacitor Speech Recognition on native mobile, Web Speech API fallback on Safari/Chrome)
* **Audio Engine**: Web Audio API Procedural Sound Machine (White noise, pink noise, brown noise, heartbeat, rain, womb rhythms)
* **Storage**: IndexedDB & LocalStorage with cryptographic PBKDF2 session tokens
* **Build System**: Vite 8 & TypeScript compiler (`tsc -b`)

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Run development server over HTTPS
npm run dev

# Run unit & integration test suites
npm test

# Build production bundle
npm run build

# Synchronize native iOS and Android projects
npx cap sync
```

---

## 📱 Mobile Device Testing

* **iOS (iPhone)**: Open `https://<YOUR_LAN_IP>:5173` in Safari $\rightarrow$ Tap Share $\rightarrow$ **Add to Home Screen**.
* **Android (Pixel)**: Open `https://<YOUR_LAN_IP>:5173` in Chrome $\rightarrow$ Tap Options $\rightarrow$ **Install app**.
* **Cloud Native Build**: Push to GitHub to trigger `.github/workflows/build-ios.yml` for cloud Xcode compilation.

---

## 🔒 Security & Privacy Protocol

* **Zero Cloud Credential Exposure**: No backend database credentials or private master keys are embedded in client code.
* **Offline-First Data Storage**: All sensitive health records are stored locally on the device by default.
* **Session Persistence**: Encrypted session tokens with 30-day automatic expiration and offline re-authentication.

---

© 2026 Nonsenseian. All rights reserved.
