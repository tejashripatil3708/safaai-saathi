import React, { useEffect, useRef, useState } from 'react';
import { Ward, Van } from '../types';
import { Language, translations } from '../core/localization';
import { ContourCard } from './ContourCard';
import { CivicHabitTips } from './CivicHabitTips';
import { GeoService, LocationCoords } from '../services/simulationService';
import { SEED_WARDS } from '../core/seedData';
import { CONSTANTS } from '../core/constants';
import {
  AlertOctagon,
  LocateFixed,
  Maximize2,
  Minimize2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MapPin,
  Compass,
  Globe,
  CheckCircle2
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import L from 'leaflet';

interface MapShellProps {
  ward: Ward;
  vans: Van[];
  userLocation: LocationCoords | null;
  lang: Language;
  onReportMissedVan: () => void;
  hasReportedMissed: boolean;
  onOpenPostCollection: () => void;
  onSelectWard?: (ward: Ward) => void;
  onToggleLang?: () => void;
  onOpenSettings?: () => void;
}

export const MapShell: React.FC<MapShellProps> = ({
  ward,
  vans,
  userLocation,
  lang,
  onReportMissedVan,
  hasReportedMissed,
  onOpenPostCollection,
  onSelectWard,
  onToggleLang,
  onOpenSettings,
}) => {
  const t = translations[lang];
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const vanMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const wardCirclesGroupRef = useRef<L.LayerGroup | null>(null);

  // Fullscreen map mode state per user requirement
  const [isFullscreenMap, setIsFullscreenMap] = useState(false);
  const [isCollectedToday, setIsCollectedToday] = useState(StorageService.isGarbageCollectedToday(ward.id));

  useEffect(() => {
    setIsCollectedToday(StorageService.isGarbageCollectedToday(ward.id));
    const handleCollectionUpdate = () => {
      setIsCollectedToday(StorageService.isGarbageCollectedToday(ward.id));
    };
    window.addEventListener('safai_sathi_collection_updated', handleCollectionUpdate);
    return () => window.removeEventListener('safai_sathi_collection_updated', handleCollectionUpdate);
  }, [ward.id]);

  // Active van for this ward's route
  const activeVan = vans.find(v => v.routeId === ward.routeId && v.status === 'on_shift') || vans[0];

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
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      wardCirclesGroupRef.current = L.layerGroup().addTo(map);
      leafletMapRef.current = map;
    }
  }, []);

  // Draw / update ALL Ward boundary sectors on the map (3-4 km radius each)
  useEffect(() => {
    if (!leafletMapRef.current || !wardCirclesGroupRef.current) return;
    const map = leafletMapRef.current;
    const group = wardCirclesGroupRef.current;

    group.clearLayers();

    SEED_WARDS.forEach(w => {
      const isSelected = w.id === ward.id;
      const wardDisplayName = lang === 'gu' ? w.nameGu : w.name;
      const shortName = wardDisplayName.split(' - ')[0];

      // Draw 3-4 km radius sector circle
      const circle = L.circle([w.center.lat, w.center.lng], {
        radius: w.radiusM || 3200,
        color: isSelected ? '#1B7A3F' : '#74897A',
        weight: isSelected ? 3 : 1.5,
        dashArray: isSelected ? undefined : '5, 8',
        fillColor: isSelected ? '#6DB36F' : '#A3C4BC',
        fillOpacity: isSelected ? 0.16 : 0.05,
      }).addTo(group);

      circle.on('click', () => {
        if (onSelectWard) {
          onSelectWard(w);
        }
      });

      // Label badge marker
      const wardLabelHtml = `
        <div style="
          background: ${isSelected ? '#1B7A3F' : 'rgba(255,255,255,0.92)'};
          color: ${isSelected ? '#ffffff' : '#14201A'};
          font-size: 11px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 20px;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.18);
          border: ${isSelected ? '2px solid #ffffff' : '1px solid #DCE5D9'};
          cursor: pointer;
        ">
          ${shortName}
          <span style="opacity:0.8; font-size:9px; margin-left:3px;">${w.code}</span>
        </div>
      `;

      const wardLabelIcon = L.divIcon({
        className: 'ward-label-marker',
        html: wardLabelHtml,
        iconAnchor: [45, 14],
        iconSize: [90, 28],
      });

      const marker = L.marker([w.center.lat, w.center.lng], {
        icon: wardLabelIcon,
      }).addTo(group);

      marker.on('click', () => {
        if (onSelectWard) {
          onSelectWard(w);
        }
      });
    });

    // Fly to current ward center smoothly
    map.flyTo([ward.center.lat, ward.center.lng], 13, { duration: 0.8 });
  }, [ward, lang]);

  // Invalidate map size when fullscreen toggled
  useEffect(() => {
    if (leafletMapRef.current) {
      setTimeout(() => {
        leafletMapRef.current?.invalidateSize();
      }, 300);
    }
  }, [isFullscreenMap]);

  // Update Van Marker with custom Animated Icon & ETA Bubble
  useEffect(() => {
    if (!leafletMapRef.current || !activeVan) return;
    const map = leafletMapRef.current;

    const vanPos: [number, number] = [activeVan.lastLocation.lat, activeVan.lastLocation.lng];

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
        14,
        { duration: 1 }
      );
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* 1. Full Bleed Map Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 bg-[#E9F1E6]" />

      {/* Official Top App Header (Clean, Large Logo & Language Switcher) */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-auto">
        <div className="bg-white/95 dark:bg-[#16221B]/95 backdrop-blur-md px-4 py-3 rounded-[24px] shadow-elev2 border border-[#DCE5D9] dark:border-[#2A3B31] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="./logo.png"
              alt="Safai Saathi"
              className="w-11 h-11 rounded-2xl object-cover shadow-sm border border-[#DCE5D9] dark:border-[#2A3B31] bg-white shrink-0"
            />
            <div>
              <h1 className="text-sm font-bold text-[#14201A] dark:text-[#EAF2E6] leading-tight">
                {lang === 'gu' ? 'સ્વચ્છતા સાથી' : 'Safai Saathi'}
              </h1>
              <p className="text-[11px] font-semibold text-[#1B7A3F] dark:text-[#6DB36F] leading-tight mt-0.5">
                {lang === 'gu' ? 'પંચમહાલ ગોધરા' : 'Panchmahal Godhra'}
              </p>
            </div>
          </div>

          {/* Clean Language Switcher in Header */}
          {onToggleLang && (
            <button
              onClick={onToggleLang}
              className="h-9 px-3 rounded-full bg-[#E4F1DF] dark:bg-[#1E2D24] text-[#1B7A3F] dark:text-[#6DB36F] font-bold text-xs flex items-center gap-1.5 transition active:scale-95 border border-[#B5CF8A]/50 hover:bg-[#D4E8CD] shadow-xs"
              title="Switch Language / ભાષા બદલો"
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>{lang === 'gu' ? 'English' : 'ગુજરાતી'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Map Controls (Right Side) */}
      <div
        className={`absolute right-4 z-20 flex flex-col gap-2 transition-all duration-300 ${
          isFullscreenMap ? 'bottom-28' : 'bottom-[370px]'
        }`}
      >
        {/* Fullscreen Map Toggle Button */}
        <button
          onClick={() => setIsFullscreenMap(prev => !prev)}
          className="w-12 h-12 rounded-full bg-white text-[#111A14] shadow-elev2 border border-[#DCE5D9] flex items-center justify-center active:scale-95 transition"
          title={isFullscreenMap ? t.exitFullscreen : t.fullscreenMap}
        >
          {isFullscreenMap ? (
            <Minimize2 className="w-5 h-5 text-[#1B7A3F]" />
          ) : (
            <Maximize2 className="w-5 h-5 text-[#1B7A3F]" />
          )}
        </button>

        {/* Recenter Van Button */}
        <button
          onClick={handleRecenter}
          className="w-12 h-12 rounded-full bg-white text-[#111A14] shadow-elev2 border border-[#DCE5D9] flex items-center justify-center active:scale-95 transition"
          aria-label="Recenter van"
        >
          <LocateFixed className="w-5 h-5 text-[#1B7A3F]" />
        </button>
      </div>

      {/* 2. Collapsible Bottom Sheet */}
      {isFullscreenMap ? (
        // Minimal Floating Bottom Bar in Fullscreen Mode
        <div className="absolute left-4 right-4 bottom-24 z-10 bg-white/90 backdrop-blur-md p-3 rounded-full shadow-elev3 border border-[#DCE5D9] flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2 pl-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1B7A3F] animate-ping" />
            <span className="text-xs font-bold text-[#14201A]">
              {isCollectedToday ? (lang === 'gu' ? '✅ કલેક્શન પૂર્ણ' : '✅ Waste Collection Done') : (isNear ? t.arrived : `${t.etaTitle}: ${etaMinutes} ${t.etaMinutes}`)}
            </span>
          </div>
          <button
            onClick={() => setIsFullscreenMap(false)}
            className="px-4 py-2 rounded-full bg-[#111A14] text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
          >
            <ChevronUp className="w-4 h-4" />
            <span>{t.exitFullscreen}</span>
          </button>
        </div>
      ) : (
        // Full Draggable / Scrollable Bottom Sheet
        <div className="absolute left-0 right-0 bottom-0 z-10 max-h-[72vh] bg-white rounded-t-[32px] shadow-elev3 border-t border-[#DCE5D9] overflow-y-auto flex flex-col px-5 pt-3 pb-28 transition-all duration-300">
          {/* Top Grab Handle with Collapse Shortcut */}
          <button
            onClick={() => setIsFullscreenMap(true)}
            className="w-full flex flex-col items-center pb-2 cursor-pointer group"
            title={t.fullscreenMap}
          >
            <div className="w-10 h-1 bg-[#74897A]/40 rounded-full group-hover:bg-[#1B7A3F] transition mb-1" />
            <span className="text-[10px] text-[#74897A] font-semibold flex items-center gap-1 group-hover:text-[#1B7A3F]">
              <ChevronDown className="w-3.5 h-3.5" />
              <span>{t.fullscreenMap}</span>
            </span>
          </button>

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
                ? `${activeVan.plateNo} • ${activeVan.driverName || 'Driver'} • ${(lang === 'gu' ? ward.nameGu : ward.name).split(' - ')[0]}`
                : t.noVanOnRoute
            }
            badge={activeVan ? activeVan.plateNo : 'ON ROUTE'}
            onAction={onOpenPostCollection}
            actionIcon={<Sparkles className="w-5 h-5 text-[#111A14]" />}
          />

          {/* Actions */}
          <div className="flex flex-col gap-2.5 mt-4">
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
              <span>{hasReportedMissed ? t.vanReported : t.vanDidNotArrive}</span>
            </button>
          </div>

          {/* Civic Habits & Reminders Carousel */}
          <div className="mt-4">
            <CivicHabitTips lang={lang} />
          </div>
        </div>
      )}
    </div>
  );
};
