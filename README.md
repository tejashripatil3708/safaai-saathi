# Safai Saathi (સ્વચ્છતા સાથી)
### Citizen-Centric Municipal & Rural Garbage Collection, Open Gutter & Public Sanitation Monitoring System
**Problem Statement ID:** PS000051 | **Sector:** Smart Cities & Urban Governance  
**Authority:** District Development Office (DDO) – Panchmahal Godhra & Godhra Nagarpalika

---

## 🌟 Overview & Architecture
Safai Saathi is a civic-tech monitoring platform built for Panchmahal district (covering urban Godhra Nagarpalika wards and rural Gram Panchayats such as Bhamaiya and Tuwa). 

The platform connects three core components under a unified data contract:
1. **Citizen App (Mobile-Responsive Web / PWA)**: Citizen reporting, live van tracking, ETA countdown, arrival notifications, and post-collection audit.
2. **Workers App (Driver Telemetry)**: Shift start/end, live GPS telemetry broadcast, and route milestone tracking.
3. **Admin Web Dashboard**: Multi-tier oversight for Ward Inspectors, Municipal Chief Officer, TDOs, and the DDO.

---

## 🚀 Key Features Implemented in the Citizen App

### 1. Zero-Login Barrier & One-Time Ward Resolution
- No complex sign-up required. Device identity is automatically preserved.
- **Auto-Match via GPS**: Automatically calculates Haversine distance from the citizen's phone to the designated centers and geofences of Godhra Wards 1–5 and Gram Panchayats.
- **Manual Ward Picker**: Immediate fallback list with Ward Codes, Inspector names, and phone numbers.

### 2. Live GPS Van Telemetry & Dynamic ETA
- Live OpenStreetMap integration with custom styled vehicle icons and pulse animation.
- Dynamic Haversine distance and ETA calculations updated in real-time.
- **Signature Contour Card**: Visual signature card rendering topographic contour lines via HTML5 Canvas with high-contrast typography per `DESIGN.md`.

### 3. Immediate Van Arrival Alerts
- Automated geofence detection triggers when the collection van is within **500 meters** (`ARRIVAL_ALERT_RADIUS_M`).
- Triggers instant in-app audio chime and high-priority arrival toast notification.

### 4. Camera-Only Verification (No Gallery Uploads)
- **Anti-Fraud Security**: HTML5 `MediaDevices.getUserMedia` stream runs directly inside the app viewfinder with 4 corner bracket overlays.
- Gallery file pickers and image uploads are strictly disabled to prevent pre-recorded or misleading photos.
- Live GPS coordinates (`lat`, `lng`) and ISO timestamp are stamped onto the photo canvas at the exact moment of shutter release.

### 5. Phone OTP Verification
- Requires verified 10-digit Indian mobile number before ticket submission.
- Supports Firebase Phone Auth with pre-configured demo verification code (`123456`) for hackathon judging reliability.

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
- **SLA Breach Enforcement**: If a complaint remains unresolved past **24–48 hours** (or reaches Level 1/2 escalation), the app automatically unlocks and displays the direct office contact cards for the **Ward Inspector, Municipal Chief Officer, or DDO Panchmahal** with a direct call button.

### 10. Civic Education & Habits
- Rotating carousel with advice on wet/dry waste segregation, avoiding open gutter blockage, and hygiene practices.

### 11. Bilingual Gujarati & English
- Complete string localization for Gujarati (`gu`) and English (`en`) with an instant header switcher.

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

## 💻 Running the Application

### 1. Start the Citizen App Development Server
From the project root:
```bash
npm run dev
```
Or directly within `apps/citizen_app`:
```bash
cd apps/citizen_app
npm run dev
```

Open the local URL (e.g. `http://localhost:3000` or `http://localhost:5173`) in any desktop or mobile browser.

### 2. Testing on Mobile Devices
To test directly on your smartphone (connected to the same Wi-Fi):
```bash
npm run dev -- --host
```
Open the printed Network URL on your phone's browser (e.g., `http://192.168.x.x:3000`).
You can use **"Add to Home Screen"** to run it as a full-screen PWA.

### 3. Demo Shortcuts for SFIC Hackathon Judges
- **Live Van Movement**: The built-in simulation engine automatically moves Van `GJ-17-GA-1001` through Godhra North corridor, updates speed, distance, and triggers the arrival chime when approaching Ward 1.
- **OTP Verification**: Enter any 10-digit phone number (e.g., `9876543210`) and use demo OTP `123456`.
- **WhatsApp Share**: Tap "Open WhatsApp" after submitting a report to view the generated ticket message.
- **Escalation Demo**: View any complaint in "My Complaints" to observe the resolution timeline and direct authority contacts.
