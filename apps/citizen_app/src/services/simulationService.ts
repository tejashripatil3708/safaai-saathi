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
   * Calculates ETA in minutes based on distance and average van speed (15 km/h)
   */
  static calculateEtaMinutes(distanceMeters: number, speedKmph = CONSTANTS.AVG_VAN_SPEED_KMPH): number {
    if (distanceMeters <= 50) return 0;
    const speedMps = (speedKmph * 1000) / 3600;
    const seconds = distanceMeters / speedMps;
    return Math.max(1, Math.round(seconds / 60));
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

// Simulated GPS Waypoints across Godhra North Ward 1 & 2 corridor
const GODHRA_WAYPOINTS: LocationCoords[] = [
  { lat: 22.7710, lng: 73.6190 }, // ST Depot Area
  { lat: 22.7725, lng: 73.6180 },
  { lat: 22.7740, lng: 73.6165 },
  { lat: 22.7758, lng: 73.6149 }, // Polan Bazar Center
  { lat: 22.7770, lng: 73.6135 },
  { lat: 22.7785, lng: 73.6120 },
  { lat: 22.7795, lng: 73.6105 },
  { lat: 22.7780, lng: 73.6125 },
  { lat: 22.7760, lng: 73.6145 },
  { lat: 22.7730, lng: 73.6175 },
];

export class VanSimulationEngine {
  private static waypointIndex = 0;
  private static listeners: ((vans: Van[]) => void)[] = [];
  private static arrivalAlertListeners: ((wardId: string, van: Van) => void)[] = [];
  private static alertedWards = new Set<string>();
  private static timer: any = null;

  static startSimulation(intervalMs = 4000): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      this.waypointIndex = (this.waypointIndex + 1) % GODHRA_WAYPOINTS.length;
      const targetPoint = GODHRA_WAYPOINTS[this.waypointIndex];

      // Update North van location
      const updatedVans = SEED_VANS.map(v => {
        if (v.id === 'van_gj17_ga_1001') {
          return {
            ...v,
            lastLocation: {
              lat: targetPoint.lat,
              lng: targetPoint.lng,
              updatedAt: new Date().toISOString(),
              speedKmph: 14 + Math.floor(Math.random() * 8),
            },
            batteryPct: Math.max(20, v.batteryPct - (Math.random() > 0.8 ? 1 : 0)),
          };
        }
        return v;
      });

      // Check arrival radius for user wards
      const movingVan = updatedVans.find(v => v.id === 'van_gj17_ga_1001')!;
      for (const ward of SEED_WARDS) {
        if (ward.routeId === movingVan.routeId) {
          const dist = GeoService.getDistanceMeters(movingVan.lastLocation, ward.center);
          if (dist <= CONSTANTS.ARRIVAL_ALERT_RADIUS_M && !this.alertedWards.has(ward.id)) {
            this.alertedWards.add(ward.id);
            this.notifyArrival(ward.id, movingVan);
          }
        }
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
