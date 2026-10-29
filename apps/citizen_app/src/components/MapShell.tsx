import React, { useEffect, useRef, useState } from 'react';
import { Ward, Van } from '../types';
import { Language, translations } from '../core/localization';
import { ContourCard } from './ContourCard';
import { CivicHabitTips } from './CivicHabitTips';
import { GeoService, LocationCoords } from '../services/simulationService';
import { CONSTANTS } from '../core/constants';
import { StorageService } from '../services/storageService';
import {
  Camera,
  AlertOctagon,
  CheckCircle,
  Truck,
  LocateFixed,
  Battery,
  Gauge,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import L from 'leaflet';

interface MapShellProps {
  ward: Ward;
  vans: Van[];
  userLocation: LocationCoords | null;
  lang: Language;
  onOpenReport: () => void;
  onReportMissedVan: () => void;
  hasReportedMissed: boolean;
  onOpenPostCollection: () => void;
}

export const MapShell: React.FC<MapShellProps> = ({
  ward,
  vans,
  userLocation,
  lang,
  onOpenReport,
  onReportMissedVan,
  hasReportedMissed,
  onOpenPostCollection,
}) => {
  const t = translations[lang];
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const vanMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const wardCircleRef = useRef<L.Circle | null>(null);

  // Active van for this ward's route
  const activeVan = vans.find(v => v.routeId === ward.routeId && v.status === 'on_shift') || vans[0];

  // Calculate ETA
  const vanDistance = activeVan
    ? GeoService.getDistanceMeters(activeVan.lastLocation, userLocation || ward.center)
    : 0;

  const etaMinutes = GeoService.calculateEtaMinutes(vanDistance, activeVan?.lastLocation.speedKmph);
  const isNear = vanDistance <= CONSTANTS.ARRIVAL_ALERT_RADIUS_M;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [ward.center.lat, ward.center.lng],
        zoom: CONSTANTS.DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: false,
      });

      // OSM Tiles (DESIGN.md Section 4.10)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;

    // Draw / update ward radius circle
    if (wardCircleRef.current) {
      wardCircleRef.current.remove();
    }
    wardCircleRef.current = L.circle([ward.center.lat, ward.center.lng], {
      radius: ward.radiusM,
      color: '#1B7A3F',
      weight: 2,
      dashArray: '6, 8',
      fillColor: '#6DB36F',
      fillOpacity: 0.12,
    }).addTo(map);

    // Initial center on ward
    map.setView([ward.center.lat, ward.center.lng], CONSTANTS.DEFAULT_ZOOM);

    return () => {
      // Keep map alive or clean up
    };
  }, [ward]);

  // Update Van Marker with custom Animated Icon & ETA Bubble
  useEffect(() => {
    if (!leafletMapRef.current || !activeVan) return;
    const map = leafletMapRef.current;

    const vanPos: [number, number] = [activeVan.lastLocation.lat, activeVan.lastLocation.lng];

    // HTML for custom Van Marker (DESIGN.md Section 4.10)
    const vanIconHtml = `
      <div class="relative flex flex-col items-center">
        <!-- ETA Bubble -->
        <div class="bg-white px-2.5 py-1 rounded-full text-[11px] font-bold text-[#14201A] shadow-md border border-[#DCE5D9] mb-1.5 whitespace-nowrap">
          ${isNear ? '🚨 ' + (lang === 'gu' ? 'નજીક છે' : 'Arriving') : etaMinutes + ' ' + t.etaMinutes}
        </div>
        <!-- Van Circle with Pulse Ring -->
        <div class="relative w-11 h-11 rounded-full bg-[#1B7A3F] border-3 border-white shadow-elev2 flex items-center justify-center text-white">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
          ${isNear ? '<span class="absolute inset-0 rounded-full border-2 border-[#1B7A3F] animate-ping opacity-75"></span>' : ''}
        </div>
      </div>
    `;

    const customVanIcon = L.divIcon({
      className: 'custom-van-marker',
      html: vanIconHtml,
      iconSize: [60, 68],
      iconAnchor: [30, 68],
    });

    if (vanMarkerRef.current) {
      vanMarkerRef.current.setLatLng(vanPos);
      vanMarkerRef.current.setIcon(customVanIcon);
    } else {
      vanMarkerRef.current = L.marker(vanPos, { icon: customVanIcon }).addTo(map);
    }
  }, [activeVan, etaMinutes, isNear, lang]);

  // Update User Location Dot
  useEffect(() => {
    if (!leafletMapRef.current || !userLocation) return;
    const map = leafletMapRef.current;
    const pos: [number, number] = [userLocation.lat, userLocation.lng];

    const userIconHtml = `
      <div class="relative w-6 h-6 flex items-center justify-center">
        <span class="absolute inset-0 rounded-full bg-[#F0873A] opacity-30 animate-ping"></span>
        <div class="w-4 h-4 rounded-full bg-[#F0873A] border-2 border-white shadow-md"></div>
      </div>
    `;

    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: userIconHtml,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(pos);
    } else {
      userMarkerRef.current = L.marker(pos, { icon: userIcon }).addTo(map);
    }
  }, [userLocation]);

  const handleRecenter = () => {
    if (leafletMapRef.current && activeVan) {
      leafletMapRef.current.flyTo(
        [activeVan.lastLocation.lat, activeVan.lastLocation.lng],
        CONSTANTS.DEFAULT_ZOOM,
        { duration: 1 }
      );
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* 1. Full Bleed Map */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 bg-[#E9F1E6]" />

      {/* Recenter Button on Map */}
      <button
        onClick={handleRecenter}
        className="absolute right-4 bottom-[380px] z-20 w-12 h-12 rounded-full bg-white text-[#111A14] shadow-elev2 border border-[#DCE5D9] flex items-center justify-center active:scale-95 transition"
        aria-label="Recenter van"
      >
        <LocateFixed className="w-5 h-5 text-[#1B7A3F]" />
      </button>

      {/* 2. Draggable Bottom Sheet [DESIGN.md Section 3.3 & 4.11] */}
      <div className="absolute left-0 right-0 bottom-0 z-10 max-h-[75vh] bg-white rounded-t-[32px] shadow-elev3 border-t border-[#DCE5D9] overflow-y-auto flex flex-col px-5 pt-3 pb-28">
        {/* Grab Handle */}
        <div className="w-10 h-1 bg-[#74897A]/40 rounded-full mx-auto mb-3" />

        {/* Contour Card for Van ETA */}
        <ContourCard
          seed={ward.id.length * 17}
          label={t.etaTitle}
          heroValue={isNear ? (lang === 'gu' ? 'નજીક છે' : 'Arrived') : etaMinutes}
          heroUnit={isNear ? '' : t.etaMinutes}
          subtitle={
            isNear
              ? t.arrived
              : activeVan
              ? `${activeVan.plateNo} • ${activeVan.lastLocation.speedKmph} km/h • ${activeVan.batteryPct}% ${t.battery}`
              : t.noVanOnRoute
          }
          badge={activeVan ? activeVan.plateNo : 'ON ROUTE'}
          onAction={onOpenPostCollection}
          actionIcon={<Sparkles className="w-5 h-5 text-[#111A14]" />}
        />

        {/* Primary Action: Report a Problem [DESIGN.md 4.1] */}
        <div className="flex flex-col gap-2.5 mt-4">
          <button
            onClick={onOpenReport}
            className="w-full h-14 rounded-full bg-[#111A14] hover:bg-black text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-xl active:scale-[0.98] transition"
          >
            <span>{t.reportProblem}</span>
            <Camera className="w-5 h-5 text-white" />
          </button>

          {/* Secondary Action: Van didn't arrive */}
          <button
            onClick={onReportMissedVan}
            disabled={hasReportedMissed}
            className={`w-full h-12 rounded-full border text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 ${
              hasReportedMissed
                ? 'bg-[#E4F1DF] text-[#1B7A3F] border-[#1B7A3F]/30'
                : 'bg-[#FFEBD9] hover:bg-[#FEDAC0] text-[#B34A0B] border-[#F0873A]/40'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>
              {hasReportedMissed ? t.vanReported : t.vanDidNotArrive}
            </span>
          </button>
        </div>

        {/* Civic Habits & Reminders Carousel */}
        <div className="mt-4">
          <CivicHabitTips lang={lang} />
        </div>
      </div>
    </div>
  );
};
