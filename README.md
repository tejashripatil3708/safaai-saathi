# Safai Saathi (સ્વચ્છતા સાથી)
### Citizen-Centric Municipal & Rural Garbage Collection, Open Gutter & Public Sanitation Monitoring System
**Problem Statement ID:** PS000051 | **Sector:** Smart Cities & Urban Governance  
**Authority:** District Development Office (DDO) – Panchmahal Godhra & Godhra Nagarpalika  
**Live PWA Web App:** [https://tejashripatil3708.github.io/safai-saathi/](https://tejashripatil3708.github.io/safai-saathi/)  
**Direct Android APK Download:** [Safai-Saathi.apk (v1.0.0)](https://github.com/tejashripatil3708/safai-saathi/releases/download/v1.0.0/Safai-Saathi.apk)  

---

## 🌟 Overview & Architecture
Safai Saathi is a civic-tech sanitation monitoring platform built specifically for Panchmahal district, covering urban Godhra Nagarpalika wards and rural Gram Panchayats (such as Bhamaiya, Tuwa, and Vavdi). 

The platform connects three core pillars under a unified real-time data contract:
1. **Citizen App (PWA & Android Native APK)**: Citizen reporting with tamper-proof GPS, live garbage van tracking, dynamic ETA countdown, arrival sound alerts, and post-collection audit.
2. **Workers App (Driver Telemetry)**: Shift start/end, live GPS telemetry broadcast, and route milestone tracking.
3. **Admin Web Dashboard**: Multi-tier oversight for Ward Inspectors, Municipal Chief Officer, TDOs, and the DDO.

---

## 📱 Delivery Platforms: PWA vs Native APK

| Feature | Progressive Web App (PWA) | Native Android APK |
| :--- | :--- | :--- |
| **What is it?** | A web application running in any browser with app-like superpowers. | A native Android package (`.apk`) wrapped via Capacitor. |
| **Installation** | Instant via browser: tap **"Install App"** / **"Add to Home Screen"**. | Download & install `Safai-Saathi.apk` on any Android device. |
| **App Store Needed?** | ❌ No, runs instantly on any phone (Android & iOS). | ❌ No, direct sideload / enterprise distribution. |
| **Offline Support** | ✅ Built-in Service Worker cache (`sw.js`). | ✅ Native device sandbox. |
| **Launcher Icon** | ✅ Official green Safai Saathi truck icon. | ✅ Adaptive multi-density launcher icon (`mdpi` to `xxxhdpi`). |
| **Direct Access** | [Open Web App](https://tejashripatil3708.github.io/safai-saathi/) | [Download APK](https://github.com/tejashripatil3708/safai-saathi/releases/download/v1.0.0/Safai-Saathi.apk) |

---

## 🚀 Key Features Implemented in the Citizen App

### 1. Tamper-Proof Auto-Detected GPS Coordinates (Anti-Fraud)
- **Zero Address Manipulation**: Citizens cannot type or fake addresses in other wards or areas.
- **Hardware GPS Querying**: Uses high-accuracy device telemetry (`navigator.geolocation.getCurrentPosition({ enableHighAccuracy: true })`).
- **Locked Coordinates Card**: High-precision latitude and longitude (e.g., `22.77582° N, 73.61495° E`) are locked in a read-only telemetry card with a `🔒 LOCKED` badge, auto-mapped ward name, and accuracy radius indicator (`±4m`).
- **Camera Stamping**: Exact GPS coordinates and ISO timestamp are burned into the captured photo canvas at the shutter press moment.

### 2. Live GPS Van Telemetry & Dynamic ETA
- Live OpenStreetMap integration with custom styled vehicle icons and pulse animation.
- Dynamic Haversine distance and real-time arrival countdown.
- **Signature Contour Card**: Visual signature card rendering topographic contour lines via HTML5 Canvas with high-contrast typography per `DESIGN.md`.

### 3. Immediate Van Arrival Alerts
- Automated geofence detection triggers when the collection van is within **500 meters** (`ARRIVAL_ALERT_RADIUS_M`).
- Instant in-app audio chime and high-priority arrival toast notification.

### 4. Camera-Only Verification (No Gallery Uploads)
- **Anti-Fraud Security**: In-app live camera viewfinder stream with 4 corner bracket overlays.
- Gallery file pickers and pre-existing photo uploads are strictly disabled to prevent recycled or fake complaints.

### 5. Phone OTP Verification
- Requires verified 10-digit Indian mobile number before ticket submission.
- Zero local phone storage for privacy compliance. Supports Firebase Phone Auth with pre-configured demo verification code (`123456`) for hackathon judging reliability.

### 6. WhatsApp Ticket Allotment & Updates (100% Free)
- Generates official ticket IDs following the strict specification: `PMH-YYYYMMDD-NNNN`.
- Direct `wa.me` deep-link allows the citizen to open their formatted complaint card directly in WhatsApp with a single tap, including a live tracking link.

### 7. "Van Didn't Arrive" Reporting
- One-tap missed collection reporting button on the home screen.
- Rate-limited to **1 report per device per day per ward** to prevent spamming.

### 8. Post-Collection Verification Micro-Prompt
- As soon as the van leaves or completes the ward, a prompt appears:  
  *"Was waste collected today from your household?"*
  - **Yes, Handed Over** (Logs verified collection).
  - **No, No Garbage Today** (Citizen produced no waste).
  - **No, Van Missed My House** (Allows selecting quick reason chips: *"Van didn't halt"*, *"Skipped street"*, *"Horn wasn't audible"*, *"Staff refused"* + custom reason note).

### 9. In-App Ticket Tracking & SLA Escalation Contacts
- Dedicated "My Complaints" list with status badges (`received`, `assigned`, `resolved`, `escalated`).
- **SLA Breach Enforcement**: If a complaint remains unresolved past **24–48 hours** (or reaches Level 1/2 escalation), the app automatically unlocks and displays direct office contact cards for the **Ward Inspector, Municipal Chief Officer, or DDO Panchmahal** with a direct 1-tap call button.

### 10. Clean Civic UI & Bilingual Support
- **Uncluttered Map Interface**: Removed unnecessary ward selector pills from the citizen map view for a clean, intuitive experience.
- **Enlarged Prominent Branding**: Displays the official green Safai Saathi logo clearly in the header, modals, and navigation dock.
- **Spacious Bottom Dock**: Restored 3-tab ergonomic navigation (`Map`, `Report Issue`, `My Complaints`) with large touch targets.
- **Instant Language Switcher**: Persistent `[ 🌐 English / ગુજરાતી ]` button in the header with full localization for Gujarati (`gu`) and English (`en`).

---

## 🛠️ Backend Infrastructure (PRD 0.7 & 0.8)

Located in `/backend`:
- **`firestore.rules`**: Granular security rules enforcing role-based permissions, rate limiting, and driver telemetry restrictions.
- **`firestore.indexes.json`**: Compound queries for device-specific complaint history and ward van status.
- **`functions/src/index.ts`**:
  - `arrivalAlert`: Geofence detection pushing alerts to `ward_{wardId}`.
  - `mergeDuplicates`: Auto-merges complaints submitted within 50 meters of an active ticket with the same category.
  - `missedCollectionAlert`: Alerts the Ward Inspector when 3+ missed reports are logged on the same day.
  - `escalateComplaints`: Scheduled every 15 minutes to bump unresolved tickets to Level 1 (24h) and Level 2 (48h).
  - `vanOfflineWatch`: Detects stale telemetry (>10 min) and marks vans offline.
  - `verifyDriverPin`: Authenticates drivers with 4-digit PIN against `vanSecrets`.
  - `sendNotice`: Broadcasts administrative civic notices.
- **`seed/seed.ts`**: Database seed script with Godhra Nagarpalika Wards 1–5, Panchmahal Gram Panchayats (Bhamaiya, Tuwa), collection routes, and initial vans.

---

## 💻 Running & Testing the Application

### 1. Run the Web App / PWA Locally
From the project root:
```bash
npm run dev
```
Or directly within `apps/citizen_app`:
```bash
cd apps/citizen_app
npm run dev
```
Open `http://localhost:5173` in any desktop or mobile browser.

### 2. Test on Smartphone via Local Wi-Fi
```bash
npm run dev -- --host
```
Open the printed local IP URL (e.g., `http://192.168.x.x:5173`) on your smartphone's browser. Tap **"Add to Home Screen"** to test the PWA installation.

### 3. Build & Run the Android App Locally
```bash
cd apps/citizen_app
npm run build
npx cap sync android
```
Open `apps/citizen_app/android` in Android Studio (or run `./gradlew assembleDebug`) to generate the native `Safai-Saathi.apk`.

---

## 🏆 Demo Shortcuts for SFIC Hackathon Judges
- **Live Van Movement**: The built-in simulation engine automatically moves Van `GJ-17-GA-1001` through the Godhra North corridor, updates speed and distance in real time, and triggers the arrival sound chime when approaching within 500m of the citizen's ward.
- **Tamper-Proof GPS Report**: Tap the red center button **"Report Issue"** — notice the latitude/longitude telemetry is automatically resolved and strictly locked with the `🔒 LOCKED` badge.
- **OTP Verification**: Enter any 10-digit Indian phone number (e.g., `9876543210`) and use demo OTP `123456`.
- **WhatsApp Share**: Tap "Open WhatsApp" after submitting a report to view the formatted ticket message with live tracking link.
- **Escalation Demo**: View any complaint in "My Complaints" to observe the resolution SLA timeline and direct authority escalation contact buttons.
