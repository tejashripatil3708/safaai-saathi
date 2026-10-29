# PRD 1 of 3: User App (Citizen)

**Goal:** Let any citizen see their ward's garbage van live and report sanitation problems in seconds, with no login.
**Users:** Residents of Godhra Nagarpalika, peri-urban towns and rural Gram Panchayats. Many are low-tech, so keep it simple.

## 0. Shared Contract (IDENTICAL in all three PRDs, do not rename anything here)

**Project:** Citizen-Centric Garbage Collection and Sanitation Monitoring System (PS000051, DDO Panchmahal Godhra)
**Stack:** Flutter (user app, driver app), React/Next.js (admin panel), Firebase (Firestore, Storage, FCM, Anonymous Auth, Cloud Functions), OpenStreetMap with flutter_map / Leaflet.
**Languages:** `gu` (Gujarati), `en` (English). All user-facing strings go in localization files, never hardcoded.

### 0.1 Naming rules
- Collections: plural camelCase. Fields: camelCase. Enum values: snake_case. IDs: strings.
- Timestamps: Firestore Timestamp. Location: `{ lat: number, lng: number }`.
- Ticket ID format: `PMH-YYYYMMDD-NNNN`.
- Agent rule: do not add, rename or remove fields or enums without asking. If something is missing, ask first.

### 0.2 Collections
- `wards`: id, name, nameGu, code, type, center{lat,lng}, radiusM, routeId, inspectorId, escalationTo (staffId)
- `vans`: id, plateNo, routeId, status, lastLocation{lat,lng,updatedAt,speedKmph}, currentTripId, batteryPct
- `vanSecrets`: id (same as vanId), driverPinHash (never readable by apps, only by Cloud Functions)
- `routes`: id, name, wardIds[] (in visiting order), scheduledStartTime ("HH:mm")
- `trips`: id, vanId, routeId, date, startedAt, endedAt, wardsDone[{wardId,doneAt,flagged}], alertedWardIds[], gpsTrail[{lat,lng,t}], mockLocationDetected
- `complaints`: id, ticketId, deviceId, category, photoUrl, location, wardId, createdAt, status, assignedTo, escalationLevel, resolvedPhotoUrl, resolvedAt, mergedInto, note
- `ratings`: id, wardId, date, stars, deviceId
- `notices`: id, targetType, targetId, message, createdAt, createdBy
- `staff`: id, authUid, name, role, wardIds[], talukaId, phone

### 0.3 Enums
- `ward.type`: urban, rural
- `van.status`: idle, on_shift, offline
- `complaint.category`: garbage_dump, open_gutter, missed_collection, other
- `complaint.status`: received, assigned, resolved, escalated
- `complaint.escalationLevel`: 0 (inspector), 1 (chief officer or TDO via `wards.escalationTo`), 2 (DDO)
- `notice.targetType`: van, ward, all
- `staff.role`: inspector, chief_officer, tdo, ddo

### 0.4 Constants (one config file per project, same names)
GPS_INTERVAL_SEC=10, GPS_INTERVAL_LOW_BATTERY_SEC=30, LOW_BATTERY_PCT=20, OFFLINE_THRESHOLD_MIN=10, STALE_LOCATION_SEC=60, ARRIVAL_ALERT_RADIUS_M=500, DUPLICATE_RADIUS_M=50, MAX_COMPLAINTS_PER_DEVICE_PER_DAY=5, MISSED_REPORT_THRESHOLD=3, ESCALATION_L1_HOURS=24, ESCALATION_L2_HOURS=48, AVG_VAN_SPEED_KMPH=15, MIN_MOVE_M=15, HEARTBEAT_SEC=30

### 0.5 Design tokens (same names in Flutter theme and CSS variables)
- `color.primary` #1E8E5A, `color.onPrimary` #FFFFFF, `color.background` #F6F8F7, `color.surface` #FFFFFF, `color.textPrimary` #1B1F1D, `color.textMuted` #5F6B66
- Status colors: `color.statusReceived` #F2A100, `color.statusAssigned` #2F6FDE, `color.statusResolved` #1E8E5A, `color.statusEscalated` #D93025
- `radius.md` 12px, `spacing.unit` 8px, font: Noto Sans (supports Gujarati)
- (If a %code design DESIGN.md is made later, it replaces these values but keeps these token names.)

### 0.6 Live location flow (the core loop)
1. Driver app writes `vans/{vanId}.lastLocation` every GPS_INTERVAL_SEC while status is `on_shift`.
2. User app finds its `wardId` (device location inside a ward's `center` + `radiusM`, or manual pick) and saves it locally.
3. `wards.routeId` tells the user app which route serves it. It listens ONLY to vans where `routeId == ward.routeId` and `status == on_shift`. It never loads all vans.
4. ETA (prototype): sum of straight-line distances from the van through the remaining wards in `routes.wardIds` up to the user's ward, divided by AVG_VAN_SPEED_KMPH. If `lastLocation.updatedAt` is older than STALE_LOCATION_SEC, show "last seen X min ago".
5. Arrival alert: the Cloud Function `arrivalAlert` runs on every `vans/{vanId}` update. If the van is within ARRIVAL_ALERT_RADIUS_M of the next ward not in `trips.alertedWardIds`, it sends an FCM push to topic `ward_{wardId}` and adds that ward to `alertedWardIds`.
6. FCM topics: `ward_{wardId}` (user app subscribes after ward is known), `van_{vanId}` (driver app subscribes after shift start), `all` (both apps subscribe on first launch).

### 0.7 Cloud Functions (backend, shared by all three apps)
- `arrivalAlert`: on `vans` write, see 0.6.
- `mergeDuplicates`: on `complaints` create, if another open complaint has the same category within DUPLICATE_RADIUS_M, set `mergedInto` on the new one.
- `missedCollectionAlert`: on `complaints` create with category `missed_collection`, if MISSED_REPORT_THRESHOLD reports exist for the same ward today, push to the ward inspector (`staff_{inspectorId}`). It never dispatches vans automatically.
- `escalateComplaints`: scheduled every 15 min. Open complaints older than ESCALATION_L1_HOURS go to level 1, older than ESCALATION_L2_HOURS go to level 2. Set `status = escalated` and notify the new level.
- `vanOfflineWatch`: scheduled every 5 min. A van `on_shift` with no update for OFFLINE_THRESHOLD_MIN gets `status = offline` and an admin alert.
- `verifyDriverPin` (callable): input `vanId`, `pin`. Compares with `vanSecrets`, rate-limited to 5 tries per 10 minutes, returns a custom auth token with claim `vanId`.
- `setDriverPin` (callable, admin only): writes the hashed PIN to `vanSecrets`.
- `sendNotice`: on `notices` create, sends FCM to topic `all`, `ward_{targetId}` or `van_{targetId}` depending on `targetType`.

### 0.8 Security rules (summary)
- Anyone (anonymous auth) can create complaints and ratings, and read their own complaints by `deviceId`.
- Anyone can read `wards`, `routes`, and the `vans` fields needed for the map (`lastLocation`, `status`, `routeId`, `plateNo`).
- Only a driver session whose token has `vanId` equal to the document can write that van's `lastLocation`, `status`, `batteryPct` and its `trips`. A driver may also update `status` of `missed_collection` complaints in its route's wards.
- `vanSecrets` is not readable or writable from any app.
- Staff role and scope come from custom claims (`role`, `staffId`), set by the seed script.
- Only signed-in `staff` can update complaint status, assignments, notices and read all complaints.

### 0.9 Team and roles (TEAM TO CONFIRM: fill in names, edit if your split differs)
| Role | Owner | Builds |
|---|---|---|
| Backend and Integration Owner | [name] | Firebase project, Firestore rules, Cloud Functions (0.7), seed script, owns section 0, reviews and merges PRs, runs the end-to-end tests |
| User App Owner | [name] | PRD-1 (user app) |
| Driver App Owner | [name] | PRD-2 (driver app) |
| Admin Panel and Demo Owner | [name] | PRD-3 (admin panel), demo story, pitch slides |

If the team is smaller, one person takes several roles. The order of work (0.14) stays the same.

### 0.10 How the team works
- **Section 0 is the contract.** Only the Backend and Integration Owner changes it. Anyone who needs a change asks in the group chat; the change is then applied to all three PRDs in the same commit and announced.
- **One monorepo:**
  ```
  /apps/user_app   /apps/driver_app   /apps/admin_panel
  /backend/functions   /backend/firestore.rules   /backend/seed
  /docs/PRD-1-user-app.md  /docs/PRD-2-driver-app.md  /docs/PRD-3-admin-panel.md  /docs/DESIGN.md (added later)
  ```
- **Git:** `main` must always run. Branch per feature: `feat/<app>-<featureId>` (example `feat/driver-F-D2`). Small PRs, one feature each. Merge only after that feature's acceptance criteria pass. The Integration Owner reviews.
- **Environments:** one shared Firebase project for the demo, region `asia-south1` (Mumbai). Everyone develops against the Firebase Emulator Suite locally so nobody breaks shared data. Shared project is used only at integration checkpoints.
- **Integration checkpoints:** end of Phase 2 and Phase 4 (see 0.14). All owners run the end-to-end tests together on real phones.
- **Blocked?** Message the owner of the thing you depend on. Never work around it by renaming fields or changing the contract.
- **Secrets:** no keys in the repo. `.env` and `google-services.json` are shared privately.

### 0.11 Architecture rules (all builders)
- **Flutter apps:** feature-first folders `lib/features/<feature>/{data,domain,ui}` and `lib/core/{config,theme,l10n,models,repositories}`. State management: Riverpod.
- **Data access only through repositories** in `core/repositories`, one per collection (`VansRepository`, `ComplaintsRepository`, ...). Widgets never call Firebase directly.
- **Models** are plain classes with `fromMap`/`toMap` that mirror 0.2 exactly. Constants live in one config file with the exact names from 0.4.
- **Styling** comes only from the theme built from 0.5 tokens. No hardcoded colors, sizes or strings. All text goes through localization (`gu`, `en`).
- **Every screen** has loading, empty, error and offline states.
- **Admin panel:** Next.js (or Vite) React with TypeScript strict. `src/types` mirrors 0.2, `src/repositories` mirrors the Flutter repositories, styles from CSS variables built from 0.5.
- **Backend:** TypeScript Cloud Functions, one file per function with the exact names in 0.7, a `constants.ts` mirroring 0.4. Distance and ETA helpers get unit tests.
- **Listeners:** attach only while the screen is visible, always cancel on dispose. The user app never listens to a whole collection.
- **Photos:** compress under 500 KB. Storage paths: `complaints/{complaintId}/photo.jpg` and `complaints/{complaintId}/resolved.jpg`.
- **Ticket IDs:** generated by the client as `PMH-YYYYMMDD-` plus 4 random digits (prototype-level collision risk is accepted).
- **Privacy:** photos of public places may contain faces or number plates. Show a one-line notice on the report screen. Store data in `asia-south1`.

### 0.12 DESIGN.md (added later)
A `/docs/DESIGN.md` design-system file will be created later from a reference UI. When it exists: read it before building any UI, treat it as the source for colors, typography, spacing, components, page layouts and light/dark mode, and let it override the values in 0.5. The token names in 0.5 do not change, so no code breaks. Until then use 0.5, and keep every style in one theme file so swapping is a single change.

### 0.13 Location sharing: full specification (all three apps)
**Who does what**
| | Driver app | Backend | User app | Admin panel |
|---|---|---|---|---|
| Role | Writes the van's position | Verifies drivers, sends alerts, detects silent vans | Finds its ward's van and shows it | Watches all vans in the staff member's scope |
| Reads | own `vans` doc, `routes`, `wards` | `vans`, `trips`, `wards`, `routes` | `wards`, `routes`, `vans` of its own route only, today's `trips` | `vans`, `trips`, `complaints` |
| Writes | `vans.lastLocation`, `vans.status`, `vans.batteryPct`, `trips` | `trips.alertedWardIds`, `vans.status = offline` | nothing to location data | nothing (read-only) |

**Data shape (written by the driver app):** `vans/{vanId}.lastLocation = { lat, lng, updatedAt (server timestamp), speedKmph }`, plus `vans.batteryPct` and `vans.status`.

**Write policy:** check the position every GPS_INTERVAL_SEC (GPS_INTERVAL_LOW_BATTERY_SEC when battery is below LOW_BATTERY_PCT). Write to Firestore only if the van moved at least MIN_MOVE_M since the last written point, or HEARTBEAT_SEC has passed since the last write, so a stopped van never looks dead.

**Flow A: driver to storage**
1. Driver signs in with the PIN (`verifyDriverPin`), taps Start Shift. Trip doc created, `vans.status = on_shift`.
2. A foreground service reads GPS and applies the write policy.
3. Each write updates `vans/{vanId}.lastLocation` (one small document, overwritten).
4. Every 30 seconds the buffered points are appended to `trips.gpsTrail` in one batch.
5. End Shift stops the service and sets `vans.status = idle`.

**Flow B: user finds the right van**
1. User app resolves `wardId` from the phone's location (nearest ward whose `center` is within `radiusM`) or the manual picker. Saved locally.
2. `wards.routeId` gives the route. The user app queries only `vans` where `routeId == that route` and `status == on_shift`.
3. If two vans are on one route, show both; ETA is for the one that has not yet passed the user's ward.
4. If no van is on shift: show "No van on route right now" and `routes.scheduledStartTime`.

**Flow C: ETA (prototype method)**
Remaining stops = wards in `routes.wardIds` order starting from the first ward not in today's `trips.wardsDone`, up to the user's ward. Distance = van position to the first remaining ward center, then ward center to ward center, up to the user's ward (straight-line, haversine). ETA minutes = distance km / speed km/h x 60, using `lastLocation.speedKmph` if it is above 5, otherwise AVG_VAN_SPEED_KMPH. If the user's ward is already in `wardsDone`, show "Collected today at HH:mm". If `updatedAt` is older than STALE_LOCATION_SEC show "Last seen X min ago".

**Flow D: arrival alert**
`arrivalAlert` runs on every `vans/{vanId}` update. It finds the next ward not in `trips.wardsDone`. If the van is within ARRIVAL_ALERT_RADIUS_M of that ward's center and the ward is not in `trips.alertedWardIds`, it sends an FCM push to topic `ward_{wardId}` and adds the ward to `alertedWardIds`. Users never poll for this.

**Flow E: admin view**
Admin panel listens to `vans` limited to its staff scope (routes of its wards). A3 Live Map shows markers, colored by `van.status`; a van with `offline` status or stale `updatedAt` gets an offline badge. Trip replay (optional) reads `trips.gpsTrail`.

**Flow F: silent van**
`vanOfflineWatch` marks a van `offline` after OFFLINE_THRESHOLD_MIN without updates and alerts the admin. When the van writes again, the driver app sets `status = on_shift`.

**Edge cases to handle**
Driver loses network (buffer trail, Firestore queues the latest write); phone restarted mid-shift (resume from `vans.currentTripId`); user outside every ward (picker); overlapping ward circles (nearest center wins); van finishes the route (status `idle`, hidden from user app); permissions denied (clear message, no crash).

**Cost and scale note (known risk)**
At a 10-second check with the write policy above, one van writes at most about 2,900 times per 8-hour shift. Firestore's free quota is 20,000 writes per day, which covers about 6 vans. Reads multiply by watchers: 100 people watching one van can cause about 290,000 reads per day, far above the free 50,000. This is fine for a demo and a small pilot. For real scale, move only the live location path to Firebase Realtime Database (billed by bandwidth), or raise MIN_MOVE_M and HEARTBEAT_SEC. Tell the Integration Owner before changing it; the contract names stay the same.

**Test L1 (end-to-end, must pass at Checkpoint 1)**
Driver phone starts a shift on route R, a second phone with the user app in a ward of R shows the van moving within 15 seconds, a third phone with a user in a ward of a different route shows no van, and the admin Live Map shows the same van.

### 0.14 Steps to complete the project (in this order)
- **Phase 0, Setup (everyone):** repo, Firebase project, emulators, config files, theme from 0.5, seed data (wards, routes, vans, staff). Done when every app boots and reads `wards` from the emulator.
- **Phase 1, Location loop:** Driver F-D1, F-D2; User F-U1; Backend `verifyDriverPin`, rules for `vans`. Done when Test L1 passes.
- **Phase 2, Complaints loop:** User F-U2, F-U3; Admin F-A1, F-A4 (basic); Backend `mergeDuplicates`, rules for `complaints`. **Checkpoint 1 / Test C1:** a complaint from the user phone appears in the admin table with photo and location within 10 seconds, and the user sees its status change after the admin assigns it.
- **Phase 3, Operations:** Driver F-D3, F-D5; Admin F-A2, F-A3; User F-U6, F-U8; Backend `arrivalAlert`, `vanOfflineWatch`.
- **Phase 4, Alerts and escalation:** User F-U4 button; Driver F-D4; Admin F-A5, F-A6; Backend `missedCollectionAlert`, `escalateComplaints`, `sendNotice`. **Checkpoint 2 / Test E1:** with test time shortened, an old complaint escalates to level 1 and the officer sees it; three missed-collection reports in one ward alert the inspector.
- **Phase 5, Optional features** in this priority: ratings (F-U7), driver Pending Reports (F-D6), ward performance (F-A7), heatmap (F-A8), vans and routes CRUD (F-A9), offline polish (F-D7), trip replay (F-A10).
- **Phase 6, Freeze and polish:** apply DESIGN.md, test on real phones, run the seed script for demo data, add the simulated van, record a backup screen video, finalize the pitch.

### 0.15 Rules for the coding agent
1. Read all of section 0 first, then only your own file's sections.
2. Optionally run `/grill-me` on this file before building, to find gaps.
3. Build one feature at a time, in the order of 0.14. After each feature, run its acceptance criteria, then commit.
4. Never rename or add collections, fields, enums, constants or tokens. If something is missing, stop and ask.
5. Do not build anything listed under "Out of scope".
6. Use DESIGN.md as soon as it exists (0.12).
7. When a feature touches another app's work (for example the driver writes what the user reads), follow the exact shapes in 0.2 and 0.13.

---

## 1. Features
**Core (must demo)**
- `F-U1` Live van map for the user's ward with ETA
- `F-U2` Report problem with in-app camera (photo + lat/lng + time), categories from 0.3
- `F-U3` Ticket ID and status tracking (`received`, `assigned`, `resolved`, `escalated`)
- `F-U4` "Van didn't arrive today" button
- `F-U5` Gujarati/English toggle
- `F-U6` Arrival push alert (topic `ward_{wardId}`)

**Optional (build if time allows)**
- `F-U7` Rate today's service (1 to 5 stars, once per ward per day)
- `F-U8` Daily ward status tick ("Collection done today" from `trips.wardsDone`)
- `F-U9` Public heatmap of complaints
- `F-U10` Optional phone OTP to recover tickets on a new device

## 2. Screens (exact titles)
- `U1 Home`: map with the ward's van(s), ETA card, big "Report a Problem" button, "Van Didn't Arrive" button, today's ward status tick.
- `U2 Report a Problem`: category chips, in-app camera only (NO gallery upload), preview, optional note, Submit. Shows the ticket ID on success.
- `U3 My Complaints`: list of this device's complaints with status colors from 0.5.
- `U4 Complaint Detail`: photo, category, status timeline, resolved photo when available.
- `U5 Rate Today's Service`: star rating (optional feature).
- `U6 Settings`: language, change ward.

## 3. Behaviour rules
- **No login.** Use Firebase Anonymous Auth; `deviceId` is the anonymous UID.
- **First launch:** ask location permission, detect `wardId` (0.6 step 2), fall back to a ward picker. Subscribe to topic `ward_{wardId}`.
- **Camera:** capture lat/lng and timestamp at the moment of the shutter. Reject if location is unavailable. Compress the photo under 500 KB before upload.
- **Rate limit:** max MAX_COMPLAINTS_PER_DEVICE_PER_DAY per device; show a friendly message when reached.
- **"Van Didn't Arrive":** creates a complaint with `category = missed_collection` for the user's ward. Allowed once per ward per day per device, and only after the route's `scheduledStartTime` has passed. It does NOT dispatch vans; see `missedCollectionAlert`.
- **Offline:** queue complaints locally with photo and send when the network returns. Show a "Will send when online" badge.
- **Van list:** if no van is `on_shift` for the ward, show "No van on route right now" and the scheduled time.

## 4. Acceptance criteria
1. With the driver app running, the van marker moves on U1 within 15 seconds of the driver's movement.
2. A complaint submitted on U2 appears in the admin panel `A4 Complaints` within 10 seconds.
3. The user can never upload a photo from the gallery.
4. App works fully in Gujarati and English.
5. A user never receives data for vans outside their ward's route.

## 5. How to build each feature (follow in this order)
**F-U1 Live van map**
1. Scaffold the Flutter app per 0.11: theme from 0.5, localization (`gu`, `en`), Firebase init, anonymous sign-in.
2. `WardsRepository.getAll()` and `resolveWard(lat, lng)`: nearest ward whose `center` is within `radiusM`; if none, return null and show the ward picker. Save `wardId` locally.
3. Subscribe to FCM topics `ward_{wardId}` and `all`.
4. `VansRepository.watchByRoute(routeId)`: only `routeId == ward.routeId` and `status == on_shift`. Attach only while U1 is visible.
5. Draw markers on `flutter_map` (OSM tiles, attribution shown). Compute ETA per 0.13 Flow C. Handle stale and no-van states.

**F-U2 Report a Problem**
1. Category chips from 0.3, then the `camera` package. No image-picker or gallery code anywhere in the app.
2. At the shutter, read the `geolocator` position and the timestamp together. Block submit if there is no location.
3. Resolve `wardId` from that position with the same function as F-U1. Compress the photo under 500 KB.
4. Check the daily limit locally (rules enforce it too). Generate `ticketId` per 0.11.
5. Upload to `complaints/{complaintId}/photo.jpg`, then create the `complaints` doc with `status = received`, `escalationLevel = 0`, `deviceId = auth uid`.
6. If offline, save photo and data in a local queue and retry on connectivity. Show "Will send when online".

**F-U3 Ticket tracking (U3, U4)**
1. `ComplaintsRepository.watchMine()`: complaints where `deviceId == uid`, newest first.
2. Status chip uses the status colors from 0.5. Show the escalation level when above 0. Show `resolvedPhotoUrl` when present.

**F-U4 Van Didn't Arrive**
1. Show the button only after today's `routes.scheduledStartTime` and when the ward is known.
2. On tap, create a complaint with `category = missed_collection`, no photo, the device location.
3. Block a second report for the same ward on the same day from the same device.

**F-U5 Language:** `app_gu.arb` and `app_en.arb`, toggle in U6, saved locally, applies instantly.
**F-U6 Arrival alert:** request notification permission, handle foreground and background messages, tapping the notification opens U1.
**Optional:** F-U7 rating doc id `{wardId}_{date}_{deviceId}`. F-U8 tick from today's `trips.wardsDone`. F-U9 heatmap needs a public read-only summary: ask the Backend Owner before building. F-U10 phone OTP.

## 6. Requirements from the User App Owner
- Flutter stable. Android 6+ (API 23) required; iOS optional.
- Packages: firebase_core, firebase_auth, cloud_firestore, firebase_storage, firebase_messaging, flutter_riverpod, flutter_map, latlong2, geolocator, camera, connectivity_plus, intl.
- Permissions: location (while in use), camera, notifications. Each permission screen explains why, in both languages.
- Must run against the Firebase Emulator Suite and the shared project by changing config only.
- Test on one low-end Android phone and at font scale 1.3. No crash in airplane mode.
- Needs from others: Backend Owner provides rules, topics, seeded `wards` and `routes`. Driver app is needed for live-van tests.
- Gives to others: complaints in the exact shape of 0.2 (admin and driver apps depend on it).
- Done when: section 4 passes on a real phone.

## 7. Common vs only for this app
- **Common (section 0, do not change):** collections, enums, constants, tokens, location flow 0.13, Cloud Functions, rules, architecture, team workflow, DESIGN.md.
- **Only this app:** screens U1 to U6, ward resolution on the device, ETA calculation, camera flow, complaint queue, language files.

## 8. Out of scope
Route optimization, payments, user accounts, chat.
