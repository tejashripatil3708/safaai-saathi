import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const sheetRef = useRef<HTMLDivElement | null>(null);

  // Smooth dragging & sliding state
  const [isFullscreenMap, setIsFullscreenMap] = useState(false);
  const isDraggingRef = useRef<boolean>(false);
  const startYRef = useRef<number>(0);
  const startTranslateYRef = useRef<number>(0);
  const prevWardIdRef = useRef<string>(ward.id);
  const lastEtaTextRef = useRef<string>('');

  const [isCollectedToday, setIsCollectedToday] = useState(StorageService.isGarbageCollectedToday(ward.id));
  const [isDutyOver, setIsDutyOver] = useState(StorageService.isWardDutyOver(ward.id));

  useEffect(() => {
    setIsCollectedToday(StorageService.isGarbageCollectedToday(ward.id));
    setIsDutyOver(StorageService.isWardDutyOver(ward.id));

    const handleCollectionUpdate = () => {
      setIsCollectedToday(StorageService.isGarbageCollectedToday(ward.id));
    };
    const handleDutyUpdate = () => {
      setIsDutyOver(StorageService.isWardDutyOver(ward.id));
    };

    window.addEventListener('safai_sathi_collection_updated', handleCollectionUpdate);
    window.addEventListener('safai_sathi_ward_duty_updated', handleDutyUpdate);
    return () => {
      window.removeEventListener('safai_sathi_collection_updated', handleCollectionUpdate);
      window.removeEventListener('safai_sathi_ward_duty_updated', handleDutyUpdate);
    };
  }, [ward.id]);

  // Active van for this ward's route
  const activeVan = vans.find(v => v.routeId === ward.routeId && v.status === 'on_shift') || vans[0];

  const vanDistance = activeVan
    ? GeoService.getDistanceMeters(activeVan.lastLocation, userLocation || ward.center)
    : 0;

  const etaMinutes = GeoService.calculateEtaMinutes(vanDistance, activeVan?.lastLocation.speedKmph);
  const isNear = vanDistance <= CONSTANTS.ARRIVAL_ALERT_RADIUS_M;

  // Initialize Leaflet Map (Runs once on mount)
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

  // Draw / update ALL Ward boundary sectors on the map (Runs only when selected ward changes)
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

    // Fly to current ward center smoothly only when ward ID actually changes (prevents loop lag)
    if (prevWardIdRef.current !== ward.id) {
      prevWardIdRef.current = ward.id;
      map.flyTo([ward.center.lat, ward.center.lng], 13, { duration: 0.8 });
    }
  }, [ward.id, lang, onSelectWard]);

  // Invalidate map size when fullscreen toggled
  useEffect(() => {
    if (leafletMapRef.current) {
      const timer = setTimeout(() => {
        leafletMapRef.current?.invalidateSize();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isFullscreenMap]);

  // Update Van Marker with custom Animated Icon & ETA Bubble without DOM thrashing
  useEffect(() => {
    if (!leafletMapRef.current || !activeVan) return;
    const map = leafletMapRef.current;
    const vanPos: [number, number] = [activeVan.lastLocation.lat, activeVan.lastLocation.lng];
    const currentEtaText = isNear ? 'arrived' : `${etaMinutes}_${lang}`;

    if (vanMarkerRef.current) {
      vanMarkerRef.current.setLatLng(vanPos);
      if (lastEtaTextRef.current !== currentEtaText) {
        lastEtaTextRef.current = currentEtaText;
        const vanIconHtml = `
          <div class="relative flex flex-col items-center">
            <div class="bg-white px-2.5 py-1 rounded-full text-[11px] font-bold text-[#14201A] shadow-md border border-[#DCE5D9] mb-1.5 whitespace-nowrap">
              ${isNear ? '🚨 ' + (lang === 'gu' ? 'નજીક છે' : 'Arriving') : etaMinutes + ' ' + t.etaMinutes}
            </div>
            <div class="relative w-11 h-11 rounded-full bg-[#1B7A3F] border-3 border-white shadow-elev2 flex items-center justify-center text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
              ${isNear ? '<span class="absolute inset-0 rounded-full border-2 border-[#1B7A3F] animate-ping opacity-75"></span>' : ''}
            </div>
          </div>
        `;
        vanMarkerRef.current.setIcon(L.divIcon({
          className: 'custom-van-marker',
          html: vanIconHtml,
          iconSize: [60, 68],
          iconAnchor: [30, 68],
        }));
      }
    } else {
      lastEtaTextRef.current = currentEtaText;
      const vanIconHtml = `
        <div class="relative flex flex-col items-center">
          <div class="bg-white px-2.5 py-1 rounded-full text-[11px] font-bold text-[#14201A] shadow-md border border-[#DCE5D9] mb-1.5 whitespace-nowrap">
            ${isNear ? '🚨 ' + (lang === 'gu' ? 'નજીક છે' : 'Arriving') : etaMinutes + ' ' + t.etaMinutes}
          </div>
          <div class="relative w-11 h-11 rounded-full bg-[#1B7A3F] border-3 border-white shadow-elev2 flex items-center justify-center text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            ${isNear ? '<span class="absolute inset-0 rounded-full border-2 border-[#1B7A3F] animate-ping opacity-75"></span>' : ''}
          </div>
        </div>
      `;
      vanMarkerRef.current = L.marker(vanPos, {
        icon: L.divIcon({
          className: 'custom-van-marker',
          html: vanIconHtml,
          iconSize: [60, 68],
          iconAnchor: [30, 68],
        })
      }).addTo(map);
    }
  }, [activeVan, etaMinutes, isNear, lang, t.etaMinutes]);

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

  // Recenter Map on Active Van
  const handleRecenter = () => {
    if (!leafletMapRef.current || !activeVan) return;
    leafletMapRef.current.flyTo(
      [activeVan.lastLocation.lat, activeVan.lastLocation.lng],
      14,
      { duration: 0.8 }
    );
  };

  // Smooth Snap State for Draggable Bottom Sheet
  const setSheetState = useCallback((collapsed: boolean) => {
    setIsFullscreenMap(collapsed);
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)';
      sheetRef.current.style.transform = collapsed ? 'translateY(calc(100% - 84px))' : 'translateY(0px)';
    }
  }, []);

  // Gesture Handlers for Bottom Sheet Dragging (Tracks finger smoothly, snaps to fullscreen when slid 80% down)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    const sheetHeight = sheetRef.current?.offsetHeight || 480;
    startTranslateYRef.current = isFullscreenMap ? (sheetHeight - 84) : 0;
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !sheetRef.current) return;
    const deltaY = e.clientY - startYRef.current;

    if (!isFullscreenMap) {
      if (deltaY > 0) {
        // Dragging down: follow finger directly
        sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      } else {
        // Resistance dragging up
        sheetRef.current.style.transform = `translateY(${deltaY * 0.25}px)`;
      }
    } else {
      const sheetHeight = sheetRef.current.offsetHeight || 480;
      const collapsedOffset = sheetHeight - 84;
      const newOffset = Math.max(0, collapsedOffset + deltaY);
      sheetRef.current.style.transform = `translateY(${newOffset}px)`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const deltaY = e.clientY - startYRef.current;
    if (!isFullscreenMap) {
      // Slid down more than 100px (~80% gesture threshold of the card) -> Snap to fullscreen map!
      if (deltaY > 100) {
        setSheetState(true);
      } else {
        setSheetState(false);
      }
    } else {
      // Dragged up more than 50px -> Snap open
      if (deltaY < -50) {
        setSheetState(false);
      } else {
        setSheetState(true);
      }
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#E9F1E6]">
      {/* 1. Interactive Leaflet Map Canvas */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing"
      />

      {/* Floating Header Banner: Ward Details & Civic Scope Badge */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex items-center justify-between">
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full shadow-elev2 border border-[#DCE5D9] flex items-center gap-2 pointer-events-auto">
          <MapPin className="w-4 h-4 text-[#1B7A3F] shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#14201A] leading-tight">
              {(lang === 'gu' ? ward.nameGu : ward.name).split(' - ')[0]}
            </span>
            <span className="text-[10px] text-[#566259] leading-tight font-medium">
              {ward.type === 'rural' ? (lang === 'gu' ? 'ગ્રામ પંચાયત' : 'Gram Panchayat') : (lang === 'gu' ? 'નગરપાલિકા વોર્ડ' : 'Nagarpalika Ward')} • {ward.code}
            </span>
          </div>
        </div>

        {/* Quick Settings & Language Shortcut */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {onToggleLang && (
            <button
              onClick={onToggleLang}
              className="px-2.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-elev2 border border-[#DCE5D9] text-xs font-bold text-[#1B7A3F] flex items-center gap-1 active:scale-95 transition"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'gu' ? 'EN' : 'ગુ'}</span>
            </button>
          )}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-md shadow-elev2 border border-[#DCE5D9] text-[#14201A] flex items-center justify-center active:scale-95 transition"
              title="Settings & Ward Selector"
            >
              ⚙️
            </button>
          )}
        </div>
      </div>

      {/* Floating Map Controls (Right Side): Clean recenter button (Fullscreen toggle removed per user request) */}
      <div
        className={`absolute right-4 z-20 flex flex-col gap-2 transition-all duration-300 ${
          isFullscreenMap ? 'bottom-28' : 'bottom-[420px]'
        }`}
      >
        <button
          onClick={handleRecenter}
          className="w-12 h-12 rounded-full bg-white text-[#111A14] shadow-elev2 border border-[#DCE5D9] flex items-center justify-center active:scale-95 transition"
          aria-label="Recenter van"
          title="Recenter Map on Van"
        >
          <LocateFixed className="w-5 h-5 text-[#1B7A3F]" />
        </button>
      </div>

      {/* 2. Draggable & Slideable Bottom Sheet */}
      <div
        ref={sheetRef}
        style={{
          transform: isFullscreenMap ? 'translateY(calc(100% - 84px))' : 'translateY(0px)',
          transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="absolute left-0 right-0 bottom-0 z-10 max-h-[78vh] bg-white rounded-t-[32px] shadow-elev3 border-t border-[#DCE5D9] flex flex-col will-change-transform touch-none"
      >
        {/* Top Grab Handle & Slide Bar (Touch-draggable down to 80% to enter fullscreen map) */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={() => {
            if (isFullscreenMap) setSheetState(false);
          }}
          className="w-full pt-3 pb-2 px-5 flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
        >
          {/* Grey drag handle pill */}
          <div className="w-12 h-1.5 bg-[#74897A]/40 rounded-full hover:bg-[#1B7A3F] transition mb-2" />

          {/* Quick Status Bar when collapsed into Fullscreen Map */}
          <div className="w-full flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1B7A3F] animate-ping shrink-0" />
              <span className="text-xs font-bold text-[#14201A] truncate max-w-[220px]">
                {isCollectedToday
                  ? (lang === 'gu' ? '✅ કલેક્શન પૂર્ણ' : '✅ Waste Collection Done')
                  : isDutyOver
                  ? (lang === 'gu' ? '🏁 વાનની સેવા પૂર્ણ' : '🏁 Van Duty Completed')
                  : (isNear ? t.arrived : `${t.etaTitle}: ${etaMinutes} ${t.etaMinutes}`)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#1B7A3F]">
              <span>{isFullscreenMap ? (lang === 'gu' ? 'વિગત જુઓ' : 'Details') : (lang === 'gu' ? 'સ્લાઇડ કરો' : 'Slide down')}</span>
              {isFullscreenMap ? (
                <ChevronUp className="w-4 h-4 animate-bounce" />
              ) : (
                <ChevronDown className="w-4 h-4 opacity-60" />
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Detailed Content inside Bottom Sheet */}
        <div className="flex-1 overflow-y-auto px-5 pt-1 pb-28 flex flex-col touch-pan-y">
          {/* Contour Card for Van ETA & Duty Status */}
          <ContourCard
            seed={ward.id.length * 17}
            label={isDutyOver ? (lang === 'gu' ? 'સેવા સંપન્ન' : 'Duty Completed') : t.etaTitle}
            heroValue={
              isDutyOver
                ? (lang === 'gu' ? 'ડ્યૂટી પૂર્ણ' : 'Duty Over')
                : isNear
                ? (lang === 'gu' ? 'નજીક છે' : 'Arrived')
                : etaMinutes
            }
            heroUnit={isDutyOver || isNear ? '' : t.etaMinutes}
            subtitle={
              isDutyOver
                ? (lang === 'gu'
                    ? (isCollectedToday ? 'આ વિસ્તારમાં આજનું કલેક્શન નોંધાયેલ છે.' : 'આ વિસ્તારમાં વાનની ડ્યૂટી સંપન્ન થઈ છે. શું કચરો આપ્યો?')
                    : (isCollectedToday ? 'Household collection recorded for today.' : 'Van collection duty in your ward is over for today. Did you hand over waste?'))
                : isNear
                ? t.arrived
                : activeVan
                ? `${activeVan.plateNo} • ${activeVan.driverName || 'Driver'} • ${(lang === 'gu' ? ward.nameGu : ward.name).split(' - ')[0]}`
                : t.noVanOnRoute
            }
            badge={isDutyOver ? 'DUTY COMPLETED' : (activeVan ? activeVan.plateNo : 'ON ROUTE')}
            onAction={isDutyOver && !isCollectedToday ? onOpenPostCollection : undefined}
            actionIcon={isDutyOver && !isCollectedToday ? <Sparkles className="w-5 h-5 text-[#111A14]" /> : undefined}
          />

          {/* Conditional Post-Collection Audit Card (Shown ONLY once the van's duty in this ward is over!) */}
          {isDutyOver && !isCollectedToday && (
            <div className="mt-3 p-3.5 rounded-[22px] bg-[#E4F1DF] border border-[#1B7A3F]/30 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🚛</span>
                <div>
                  <p className="text-xs font-bold text-[#1B7A3F]">
                    {lang === 'gu' ? 'ડ્યૂટી પૂર્ણ: શું કચરો આપ્યો?' : 'Duty Over: Did you give waste?'}
                  </p>
                  <p className="text-[11px] text-[#566259]">
                    {lang === 'gu' ? 'વાનની સેવા પૂર્ણ થઈ ગઈ છે. પુષ્ટિ કરો.' : 'Van duty ended. Tap to confirm if waste was collected.'}
                  </p>
                </div>
              </div>
              <button
                onClick={onOpenPostCollection}
                className="px-3.5 py-1.5 rounded-full bg-[#1B7A3F] text-white text-xs font-bold shadow-sm active:scale-95 transition"
              >
                {lang === 'gu' ? 'જવાબ આપો' : 'Confirm'}
              </button>
            </div>
          )}

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
      </div>
    </div>
  );
};
