import * as admin from 'firebase-admin';

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export const SEED_WARDS = [
  {
    id: 'ward_godhra_01',
    name: 'Ward 1 - Polan Bazar & Chitra Cinema Area',
    nameGu: 'વોર્ડ ૧ - પોલન બજાર અને ચિત્રા ટોકીઝ વિસ્તાર',
    code: 'GNP-W01',
    type: 'urban',
    center: { lat: 22.7758, lng: 73.6149 },
    radiusM: 800,
    routeId: 'route_godhra_north',
    inspectorId: 'staff_inspector_01',
    escalationTo: 'staff_chief_officer',
  },
  {
    id: 'ward_godhra_02',
    name: 'Ward 2 - Station Road & ST Bus Depot',
    nameGu: 'વોર્ડ ૨ - સ્ટેશન રોડ અને એસ.ટી. બસ સ્ટેન્ડ',
    code: 'GNP-W02',
    type: 'urban',
    center: { lat: 22.7712, lng: 73.6198 },
    radiusM: 750,
    routeId: 'route_godhra_north',
    inspectorId: 'staff_inspector_01',
    escalationTo: 'staff_chief_officer',
  },
  {
    id: 'ward_godhra_03',
    name: 'Ward 3 - Civil Hospital & Collectorate Complex',
    nameGu: 'વોર્ડ ૩ - સિવિલ હોસ્પિટલ અને કલેક્ટર કચેરી સંકુલ',
    code: 'GNP-W03',
    type: 'urban',
    center: { lat: 22.7801, lng: 73.6264 },
    radiusM: 900,
    routeId: 'route_godhra_north',
    inspectorId: 'staff_inspector_02',
    escalationTo: 'staff_chief_officer',
  },
  {
    id: 'ward_godhra_04',
    name: 'Ward 4 - Vavdi Road & Bamroli Swachhata Zone',
    nameGu: 'વોર્ડ ૪ - વાવડી રોડ અને બામરોલી સ્વચ્છતા ઝોન',
    code: 'GNP-W04',
    type: 'urban',
    center: { lat: 22.7680, lng: 73.6080 },
    radiusM: 850,
    routeId: 'route_godhra_south',
    inspectorId: 'staff_inspector_02',
    escalationTo: 'staff_chief_officer',
  },
  {
    id: 'ward_godhra_05',
    name: 'Ward 5 - Lunawada Road & Ankleshwar Highway',
    nameGu: 'વોર્ડ ૫ - લુણાવાડા રોડ અને અંકલેશ્વર હાઇવે',
    code: 'GNP-W05',
    type: 'urban',
    center: { lat: 22.7850, lng: 73.6050 },
    radiusM: 950,
    routeId: 'route_godhra_south',
    inspectorId: 'staff_inspector_03',
    escalationTo: 'staff_chief_officer',
  },
  {
    id: 'ward_rural_bhamaiya',
    name: 'Bhamaiya Gram Panchayat',
    nameGu: 'ભામાઇયા ગ્રામ પંચાયત (ગોધરા તાલુકો)',
    code: 'GP-BHAM',
    type: 'rural',
    center: { lat: 22.7550, lng: 73.6300 },
    radiusM: 1300,
    routeId: 'route_panchmahal_rural',
    inspectorId: 'staff_talati_01',
    escalationTo: 'staff_tdo_godhra',
  },
  {
    id: 'ward_rural_tuwa',
    name: 'Tuwa Gram Panchayat & Kund Area',
    nameGu: 'ટુવા ગ્રામ પંચાયત અને ગરમ કુંડ વિસ્તાર',
    code: 'GP-TUWA',
    type: 'rural',
    center: { lat: 22.7980, lng: 73.5500 },
    radiusM: 1500,
    routeId: 'route_panchmahal_rural',
    inspectorId: 'staff_talati_02',
    escalationTo: 'staff_tdo_godhra',
  }
];

export const SEED_ROUTES = [
  {
    id: 'route_godhra_north',
    name: 'Godhra North Urban Corridor',
    wardIds: ['ward_godhra_01', 'ward_godhra_02', 'ward_godhra_03'],
    scheduledStartTime: '07:30',
  },
  {
    id: 'route_godhra_south',
    name: 'Godhra South Arterial Route',
    wardIds: ['ward_godhra_04', 'ward_godhra_05'],
    scheduledStartTime: '08:00',
  },
  {
    id: 'route_panchmahal_rural',
    name: 'Panchmahal Gram Swachhata Circuit',
    wardIds: ['ward_rural_bhamaiya', 'ward_rural_tuwa'],
    scheduledStartTime: '08:30',
  }
];

export const SEED_VANS = [
  {
    id: 'van_gj17_ga_1001',
    plateNo: 'GJ-17-GA-1001',
    routeId: 'route_godhra_north',
    status: 'on_shift',
    lastLocation: {
      lat: 22.7735,
      lng: 73.6165,
      updatedAt: new Date().toISOString(),
      speedKmph: 18,
    },
    currentTripId: 'trip_20261029_001',
    batteryPct: 88,
  },
  {
    id: 'van_gj17_ga_1002',
    plateNo: 'GJ-17-GA-1002',
    routeId: 'route_godhra_south',
    status: 'on_shift',
    lastLocation: {
      lat: 22.7695,
      lng: 73.6065,
      updatedAt: new Date().toISOString(),
      speedKmph: 14,
    },
    currentTripId: 'trip_20261029_002',
    batteryPct: 76,
  }
];

export const SEED_STAFF = [
  {
    id: 'staff_inspector_01',
    authUid: 'uid_insp_01',
    name: 'Rajesh Parmar',
    role: 'inspector',
    wardIds: ['ward_godhra_01', 'ward_godhra_02'],
    talukaId: 'godhra',
    phone: '+91 94260 12341',
  },
  {
    id: 'staff_chief_officer',
    authUid: 'uid_co_01',
    name: 'Smt. Vaishali Patel (Chief Officer)',
    role: 'chief_officer',
    wardIds: ['ward_godhra_01', 'ward_godhra_02', 'ward_godhra_03', 'ward_godhra_04', 'ward_godhra_05'],
    talukaId: 'godhra',
    phone: '+91 94260 99001',
  },
  {
    id: 'staff_tdo_godhra',
    authUid: 'uid_tdo_01',
    name: 'Shri M. K. Solanki (TDO Godhra)',
    role: 'tdo',
    wardIds: ['ward_rural_bhamaiya', 'ward_rural_tuwa'],
    talukaId: 'godhra',
    phone: '+91 94260 88002',
  },
  {
    id: 'staff_ddo_panchmahal',
    authUid: 'uid_ddo_01',
    name: 'Shri D. K. Raval, IAS (DDO Panchmahal)',
    role: 'ddo',
    wardIds: [],
    talukaId: 'panchmahal_district',
    phone: '02672-241200',
  }
];

export async function runSeed() {
  console.log('Seeding Panchmahal Godhra civic sanitation database...');
  const batch = db.batch();

  for (const w of SEED_WARDS) {
    batch.set(db.collection('wards').doc(w.id), w);
  }
  for (const r of SEED_ROUTES) {
    batch.set(db.collection('routes').doc(r.id), r);
  }
  for (const v of SEED_VANS) {
    batch.set(db.collection('vans').doc(v.id), v);
  }
  for (const s of SEED_STAFF) {
    batch.set(db.collection('staff').doc(s.id), s);
  }

  await batch.commit();
  console.log('Seeding complete! Wards, Routes, Vans, and Staff initialized.');
}
