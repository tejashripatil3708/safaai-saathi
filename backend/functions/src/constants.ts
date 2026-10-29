export const CONSTANTS = {
  GPS_INTERVAL_SEC: 10,
  GPS_INTERVAL_LOW_BATTERY_SEC: 30,
  LOW_BATTERY_PCT: 20,
  OFFLINE_THRESHOLD_MIN: 10,
  STALE_LOCATION_SEC: 60,
  ARRIVAL_ALERT_RADIUS_M: 500,
  DUPLICATE_RADIUS_M: 50,
  MAX_COMPLAINTS_PER_DEVICE_PER_DAY: 5,
  MISSED_REPORT_THRESHOLD: 3,
  ESCALATION_L1_HOURS: 24,
  ESCALATION_L2_HOURS: 48,
  AVG_VAN_SPEED_KMPH: 15,
  MIN_MOVE_M: 15,
  HEARTBEAT_SEC: 30,
};

export function getDistanceMeters(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number {
  const R = 6371e3;
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
