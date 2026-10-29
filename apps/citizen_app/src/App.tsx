import React, { useState, useEffect } from 'react';
import { Ward, Van, Complaint } from './types';
import { SEED_WARDS, SEED_VANS } from './core/seedData';
import { StorageService } from './services/storageService';
import { VanSimulationEngine, LocationCoords } from './services/simulationService';
import { Language, translations } from './core/localization';
import { MapShell } from './components/MapShell';
import { GlassTopBar } from './components/GlassTopBar';
import { PillNav, NavTab } from './components/PillNav';
import { MyComplaintsView } from './components/MyComplaintsView';
import { SettingsView } from './components/SettingsView';
import { ReportProblemSheet } from './components/ReportProblemSheet';
import { PostCollectionModal } from './components/PostCollectionModal';
import { BellRing, CheckCircle, WifiOff } from 'lucide-react';

export const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(StorageService.getLanguage());
  const [currentTab, setCurrentTab] = useState<NavTab>('map');
  const [wardId, setWardId] = useState<string>(
    StorageService.getSelectedWardId() || SEED_WARDS[0].id
  );
  const [vans, setVans] = useState<Van[]>(SEED_VANS);
  const [complaints, setComplaints] = useState<Complaint[]>(StorageService.getComplaints());
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isPostCollectionOpen, setIsPostCollectionOpen] = useState(false);
  const [hasReportedMissed, setHasReportedMissed] = useState(
    StorageService.hasReportedMissedToday(wardId)
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [arrivalBanner, setArrivalBanner] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  const t = translations[lang];
  const selectedWard = SEED_WARDS.find(w => w.id === wardId) || SEED_WARDS[0];

  // Request browser geolocation once on boot
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        _err => {
          // Default to Godhra center
          setUserLocation({ lat: 22.7758, lng: 73.6149 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Start Live Van GPS Simulation Engine
  useEffect(() => {
    VanSimulationEngine.startSimulation(3500);

    const unsubVans = VanSimulationEngine.onVansUpdate(updatedVans => {
      setVans(updatedVans);
    });

    const unsubArrival = VanSimulationEngine.onArrivalAlert((alertWardId, van) => {
      if (alertWardId === wardId) {
        setArrivalBanner({
          visible: true,
          message:
            lang === 'gu'
              ? `🚨 સફાઈ વાન (${van.plateNo}) તમારા વોર્ડ વિસ્તારમાં પહોંચી ગઈ છે!`
              : `🚨 Sanitation Van (${van.plateNo}) has entered your ward area!`,
        });

        // Trigger post-collection check prompt shortly after arrival
        setTimeout(() => {
          if (!StorageService.hasAnsweredFeedbackToday(wardId)) {
            setIsPostCollectionOpen(true);
          }
        }, 8000);
      }
    });

    return () => {
      unsubVans();
      unsubArrival();
      VanSimulationEngine.stopSimulation();
    };
  }, [wardId, lang]);

  const handleToggleLang = () => {
    const nextLang = lang === 'gu' ? 'en' : 'gu';
    setLang(nextLang);
    StorageService.setLanguage(nextLang);
  };

  const handleWardChange = (newWardId: string) => {
    setWardId(newWardId);
    StorageService.setSelectedWardId(newWardId);
    setHasReportedMissed(StorageService.hasReportedMissedToday(newWardId));
  };

  const handleComplaintCreated = (newComplaint: Complaint) => {
    setComplaints(prev => [newComplaint, ...prev]);
  };

  const handleReportMissedVan = () => {
    if (hasReportedMissed) return;

    const missedComplaint: Complaint = {
      id: 'cmp_missed_' + Date.now().toString(36),
      ticketId: `PMH-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      deviceId: StorageService.getDeviceId(),
      category: 'missed_collection',
      address: StorageService.getCitizenAddress(),
      photoUrl: '',
      location: userLocation || selectedWard.center,
      wardId: selectedWard.id,
      createdAt: new Date().toISOString(),
      status: 'received',
      assignedTo: selectedWard.inspectorId,
      assignedName: selectedWard.inspectorName,
      assignedPhone: selectedWard.inspectorPhone,
      escalationLevel: 0,
      note: 'Doorstep collection missed for today.',
      slaDeadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    };

    StorageService.saveComplaint(missedComplaint);
    StorageService.markReportedMissedToday(wardId);
    setHasReportedMissed(true);
    setComplaints(prev => [missedComplaint, ...prev]);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#F3F6F2] text-[#14201A] flex flex-col overflow-hidden select-none font-sans">
      {/* Top Arrival Alert Toast Banner */}
      {arrivalBanner.visible && (
        <div className="absolute top-20 left-4 right-4 z-40 bg-[#111A14] text-white px-4 py-3 rounded-2xl shadow-elev3 border-2 border-[#1B7A3F] flex items-center justify-between animate-in slide-in-from-top">
          <div className="flex items-center gap-2.5">
            <BellRing className="w-5 h-5 text-[#F0873A] animate-bounce shrink-0" />
            <p className="text-xs font-bold leading-tight">
              {arrivalBanner.message}
            </p>
          </div>
          <button
            onClick={() => setArrivalBanner({ visible: false, message: '' })}
            className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area based on Tab */}
      <main className="flex-1 w-full h-full relative overflow-y-auto">
        {currentTab === 'map' && (
          <>
            <GlassTopBar
              ward={selectedWard}
              lang={lang}
              onToggleLang={handleToggleLang}
              onOpenSettings={() => setCurrentTab('settings')}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(prev => !prev)}
            />
            <MapShell
              ward={selectedWard}
              vans={vans}
              userLocation={userLocation}
              lang={lang}
              onOpenReport={() => setIsReportOpen(true)}
              onReportMissedVan={handleReportMissedVan}
              hasReportedMissed={hasReportedMissed}
              onOpenPostCollection={() => setIsPostCollectionOpen(true)}
            />
          </>
        )}

        {currentTab === 'complaints' && (
          <MyComplaintsView
            complaints={complaints}
            lang={lang}
            onOpenReport={() => setIsReportOpen(true)}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            currentWardId={wardId}
            onWardChange={handleWardChange}
            lang={lang}
            onLanguageChange={newLang => {
              setLang(newLang);
              StorageService.setLanguage(newLang);
            }}
          />
        )}
      </main>

      {/* Floating Pill Bottom Navigation (DESIGN.md 4.5) */}
      <PillNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        complaintsCount={complaints.filter(c => c.status !== 'resolved').length}
        lang={lang}
      />

      {/* Screen U2: Report Problem Modal */}
      <ReportProblemSheet
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        wardId={wardId}
        lang={lang}
        onComplaintCreated={handleComplaintCreated}
      />

      {/* Post-Collection Verification Modal ("Did you add garbage?") */}
      <PostCollectionModal
        isOpen={isPostCollectionOpen}
        wardId={wardId}
        onClose={() => setIsPostCollectionOpen(false)}
        onSubmitSuccess={() => {}}
        lang={lang}
      />
    </div>
  );
};
export default App;
