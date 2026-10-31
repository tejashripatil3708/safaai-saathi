import { StorageService } from './storageService';
import { Ward, Van } from '../types';
import { SEED_WARDS, SEED_VANS } from '../core/seedData';
import { CONSTANTS } from '../core/constants';

export interface LocationCoords {
  lat: number;
  lng: number;
}

export class GeoService {
  /**
   * Calculates Haversine distance between two coordinates in meters
   */
  static getDistanceMeters(p1: LocationCoords, p2: LocationCoords): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (p1.lat * Math.PI) / 180;
    const phi2 = (p2.lat * Math.PI) / 180;
    const deltaPhi = ((p2.lat - p1.lat) * Math.PI) / 180;
    const deltaLambda = ((p2.lng - p1.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Matches coordinates to the closest ward whose center is within radiusM
   */
  static findWardByLocation(location: LocationCoords, wards: Ward[] = SEED_WARDS): Ward | null {
    let closestWard: Ward | null = null;
    let minDistance = Infinity;

    for (const ward of wards) {
      const dist = this.getDistanceMeters(location, ward.center);
      if (dist <= ward.radiusM && dist < minDistance) {
        minDistance = dist;
        closestWard = ward;
      }
    }

    // If none within exact radius, fall back to nearest ward
    if (!closestWard && wards.length > 0) {
      closestWard = wards.reduce((prev, curr) => {
        const prevDist = this.getDistanceMeters(location, prev.center);
        const currDist = this.getDistanceMeters(location, curr.center);
        return currDist < prevDist ? curr : prev;
      });
    }

    return closestWard;
  }

  /**
   * Reverse geocodes coordinates to a real-world human-readable street/locality address.
   * Uses OpenStreetMap Nominatim with fast fallback to BigDataCloud reverse geocoder.
   */
  static async reverseGeocode(location: LocationCoords): Promise<string | null> {
    const lat = location.lat;
    const lng = location.lng;

    // 1. Try OpenStreetMap Nominatim
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'SafaaiSaathiPWA/1.0' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const road = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood;
        const area = addr.suburb || addr.neighbourhood || addr.residential;
        const city = addr.city || addr.town || addr.village || addr.county;
        const state = addr.state;

        const parts = [road, area, city, state].filter(Boolean);
        const cleanParts = parts.filter((item, pos, ary) => !pos || item !== ary[pos - 1]);
        if (cleanParts.length >= 2) {
          return cleanParts.join(', ');
        }
        if (data.display_name) {
          const split = data.display_name.split(',');
          return split.slice(0, 3).map((s: string) => s.trim()).join(', ');
        }
      }
    } catch {
      // Nominatim failed or timed out; try fallback
    }

    // 2. Fallback to BigDataCloud client-side reverse geocoder
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const parts = [
          data.locality || data.localityInfo?.administrative?.[3]?.name,
          data.city || data.localityInfo?.administrative?.[2]?.name,
          data.principalSubdivision
        ].filter(Boolean);
        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
    } catch {
      // Offline fallback
    }

    return null;
  }

  /**
   * Calculates ETA in minutes based on distance and average van speed (15 km/h)
   */
  static calculateEtaMinutes(distanceMeters: number, _speedKmph = CONSTANTS.AVG_VAN_SPEED_KMPH): number {
    if (distanceMeters <= 250) return 0;
    // Calculate realistic urban ETA (capped reasonably to 12 minutes within municipal ward boundaries)
    const minutes = Math.round(distanceMeters / 250);
    return Math.min(12, Math.max(1, minutes));
  }

  /**
   * Generates a ticket ID per PRD 0.1 format: PMH-YYYYMMDD-NNNN
   */
  static generateTicketId(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `PMH-${yyyy}${mm}${dd}-${randomDigits}`;
  }
}

// 1. Van 1 (Route North: Wards 1, 2, 3 - Polan Bazar, Station Road, Civil Hospital)
const NORTH_WAYPOINTS: LocationCoords[] = [
  { lat: 22.7758, lng: 73.6149 }, // Ward 1 Center
  { lat: 22.7745, lng: 73.6160 },
  { lat: 22.7728, lng: 73.6185 },
  { lat: 22.7712, lng: 73.6198 }, // Ward 2 Center
  { lat: 22.7735, lng: 73.6215 },
  { lat: 22.7765, lng: 73.6240 },
  { lat: 22.7801, lng: 73.6264 }, // Ward 3 Center
  { lat: 22.7780, lng: 73.6210 },
  { lat: 22.7765, lng: 73.6170 },
];

// 2. Van 2 (Route South: Wards 4, 5 - Vavdi Road, Bamroli, Lunawada Road)
const SOUTH_WAYPOINTS: LocationCoords[] = [
  { lat: 22.7680, lng: 73.6080 }, // Ward 4 Center
  { lat: 22.7710, lng: 73.6070 },
  { lat: 22.7750, lng: 73.6060 },
  { lat: 22.7800, lng: 73.6055 },
  { lat: 22.7850, lng: 73.6050 }, // Ward 5 Center
  { lat: 22.7810, lng: 73.6065 },
  { lat: 22.7730, lng: 73.6075 },
];

// 3. Van 3 (Route Rural: Bhamaiya & Tuwa Gram Panchayats)
const RURAL_WAYPOINTS: LocationCoords[] = [
  { lat: 22.7550, lng: 73.6300 }, // Bhamaiya Center
  { lat: 22.7580, lng: 73.6250 },
  { lat: 22.7620, lng: 73.5850 }, // Vavdi Center & Highway Cluster
  { lat: 22.7750, lng: 73.5750 },
  { lat: 22.7980, lng: 73.5500 }, // Tuwa Center & Hot Springs
  { lat: 22.7800, lng: 73.5800 },
  { lat: 22.7650, lng: 73.6000 },
];

export class VanSimulationEngine {
  private static northIndex = 0;
  private static southIndex = 0;
  private static ruralIndex = 0;
  private static listeners: ((vans: Van[]) => void)[] = [];
  private static arrivalAlertListeners: ((wardId: string, van: Van) => void)[] = [];
  private static dutyCompletedListeners: ((wardId: string, van: Van) => void)[] = [];
  private static alertedWards = new Set<string>();
  private static completedWards = new Set<string>();
  private static timer: any = null;

  static startSimulation(intervalMs = 4000): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      this.northIndex = (this.northIndex + 1) % NORTH_WAYPOINTS.length;
      this.southIndex = (this.southIndex + 1) % SOUTH_WAYPOINTS.length;
      this.ruralIndex = (this.ruralIndex + 1) % RURAL_WAYPOINTS.length;

      const pNorth = NORTH_WAYPOINTS[this.northIndex];
      const pSouth = SOUTH_WAYPOINTS[this.southIndex];
      const pRural = RURAL_WAYPOINTS[this.ruralIndex];

      // Update all 3 vans in their respective allotted 2-3 wards
      const updatedVans = SEED_VANS.map(v => {
        let p = pNorth;
        if (v.routeId === 'route_godhra_south') p = pSouth;
        if (v.routeId === 'route_panchmahal_rural') p = pRural;

        return {
          ...v,
          status: 'on_shift' as const,
          lastLocation: {
            lat: p.lat,
            lng: p.lng,
            updatedAt: new Date().toISOString(),
            speedKmph: 15 + Math.floor(Math.random() * 5),
          },
          batteryPct: Math.max(20, (v.batteryPct ?? 80) - (Math.random() > 0.8 ? 1 : 0)),
        };
      });

      // Check arrival radius for all wards
      for (const v of updatedVans) {
        for (const ward of SEED_WARDS) {
          if (ward.routeId === v.routeId) {
            const dist = GeoService.getDistanceMeters(v.lastLocation, ward.center);
            if (dist <= CONSTANTS.ARRIVAL_ALERT_RADIUS_M && !this.alertedWards.has(ward.id)) {
              this.alertedWards.add(ward.id);
              this.notifyArrival(ward.id, v);
            }
          }
        }
      }

      // Check for ward duty completion transitions (only after van has finished serving ward)
      const vanNorth = updatedVans.find(v => v.routeId === 'route_godhra_north') || updatedVans[0];
      if (this.northIndex >= 3 && !this.isWardDutyOver('ward_godhra_01')) {
        this.markWardDutyCompleted('ward_godhra_01', vanNorth);
      }
      if (this.northIndex >= 6 && !this.isWardDutyOver('ward_godhra_02')) {
        this.markWardDutyCompleted('ward_godhra_02', vanNorth);
      }
      if (this.northIndex >= 8 && !this.isWardDutyOver('ward_godhra_03')) {
        this.markWardDutyCompleted('ward_godhra_03', vanNorth);
      }

      const vanSouth = updatedVans.find(v => v.routeId === 'route_godhra_south') || updatedVans[1];
      if (this.southIndex >= 4 && !this.isWardDutyOver('ward_godhra_04')) {
        this.markWardDutyCompleted('ward_godhra_04', vanSouth);
      }
      if (this.southIndex >= 6 && !this.isWardDutyOver('ward_godhra_05')) {
        this.markWardDutyCompleted('ward_godhra_05', vanSouth);
      }

      const vanRural = updatedVans.find(v => v.routeId === 'route_panchmahal_rural') || updatedVans[2];
      if (this.ruralIndex >= 2 && !this.isWardDutyOver('ward_rural_bhamaiya')) {
        this.markWardDutyCompleted('ward_rural_bhamaiya', vanRural);
      }
      if (this.ruralIndex >= 4 && !this.isWardDutyOver('ward_rural_vavdi')) {
        this.markWardDutyCompleted('ward_rural_vavdi', vanRural);
      }
      if (this.ruralIndex >= 6 && !this.isWardDutyOver('ward_rural_tuwa')) {
        this.markWardDutyCompleted('ward_rural_tuwa', vanRural);
      }

      this.listeners.forEach(fn => fn(updatedVans));
    }, intervalMs);
  }

  static stopSimulation(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  static onVansUpdate(fn: (vans: Van[]) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  static onArrivalAlert(fn: (wardId: string, van: Van) => void): () => void {
    this.arrivalAlertListeners.push(fn);
    return () => {
      this.arrivalAlertListeners = this.arrivalAlertListeners.filter(l => l !== fn);
    };
  }

  static onDutyCompleted(fn: (wardId: string, van: Van) => void): () => void {
    this.dutyCompletedListeners.push(fn);
    return () => {
      this.dutyCompletedListeners = this.dutyCompletedListeners.filter(l => l !== fn);
    };
  }

  static isWardDutyOver(wardId: string): boolean {
    if (typeof window !== 'undefined' && StorageService.isWardDutyOver(wardId)) {
      return true;
    }
    return this.completedWards.has(wardId);
  }

  static markWardDutyCompleted(wardId: string, van?: Van): void {
    if (this.completedWards.has(wardId)) return;
    this.completedWards.add(wardId);
    if (typeof window !== 'undefined') {
      StorageService.setWardDutyOver(wardId, true);
    }
    const resolvedVan = van || SEED_VANS.find(v => {
      const ward = SEED_WARDS.find(w => w.id === wardId);
      return ward && v.routeId === ward.routeId;
    }) || SEED_VANS[0];
    this.notifyDutyCompleted(wardId, resolvedVan);
  }

  static resetWardDuty(wardId: string): void {
    this.completedWards.delete(wardId);
    if (typeof window !== 'undefined') {
      StorageService.resetWardDutyOver(wardId);
    }
  }

  private static notifyDutyCompleted(wardId: string, van: Van): void {
    this.dutyCompletedListeners.forEach(fn => fn(wardId, van));
  }

  private static notifyArrival(wardId: string, van: Van): void {
    this.arrivalAlertListeners.forEach(fn => fn(wardId, van));
    // Audio chime if enabled in browser
    try {
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch {
      // Ignored if user hasn't interacted yet
    }
  }
}
