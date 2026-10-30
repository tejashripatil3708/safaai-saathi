import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, Sparkles, Smartphone } from 'lucide-react';
import { translations, Language } from '../core/localization';
import { LocationCoords } from '../services/simulationService';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string, location: LocationCoords, timestamp: string) => void;
  lang: Language;
  initialCoords?: LocationCoords | null;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  lang,
  initialCoords,
}) => {
  const t = translations[lang];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedCoords, setCapturedCoords] = useState<LocationCoords | null>(null);
  const [capturedTimestamp, setCapturedTimestamp] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setHasPermission(null);
      setErrorMsg(null);
      return;
    }

    // Auto-initiate camera on modal open
    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const getMediaStream = async (): Promise<MediaStream> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('navigator.mediaDevices.getUserMedia not supported');
    }

    // 1. Try environment/user ideal constraints
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: false,
      });
    } catch {
      // 2. Try simple facingMode
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
      } catch {
        // 3. Fallback to basic video without constraints
        return await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
    }
  };

  const startCamera = async () => {
    setCameraLoading(true);
    setErrorMsg(null);
    stopCamera();

    try {
      const stream = await getMediaStream();
      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        try {
          await videoRef.current.play();
        } catch {
          // Play was prevented or user gesture needed
        }
      }
      setCameraLoading(false);
    } catch (err: any) {
      console.warn('In-app live camera stream failed; enabling native camera fallback:', err);
      setCameraLoading(false);
      setHasPermission(false);
      setErrorMsg(
        lang === 'gu'
          ? 'લાઇવ કેમેરા પ્રવાહ શરૂ થયો નથી. આપના ફોનનો કેમેરો સીધો ખોલવા માટે નીચેનું બટન દબાવો.'
          : 'Live camera stream not supported directly in WebView. Tap below to snap directly using your phone camera.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const openNativeCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const img = new Image();
        img.onload = () => {
          stampAndSave(img);
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const stampAndSave = (source: HTMLVideoElement | HTMLImageElement) => {
    const now = new Date();
    const timeStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();

    const applyWatermark = (coords: LocationCoords) => {
      const canvas = document.createElement('canvas');
      const width = 'videoWidth' in source ? source.videoWidth : source.naturalWidth;
      const height = 'videoHeight' in source ? source.videoHeight : source.naturalHeight;
      canvas.width = width > 0 ? width : 1280;
      canvas.height = height > 0 ? height : 720;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

        // Watermark band
        const barHeight = Math.max(70, Math.floor(canvas.height * 0.11));
        ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
        ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

        // Watermark text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.max(16, Math.floor(barHeight * 0.32))}px sans-serif`;
        ctx.fillText(
          `📍 GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}  |  🕒 ${timeStr}`,
          24,
          canvas.height - (barHeight * 0.52)
        );

        ctx.fillStyle = '#6DB36F';
        ctx.font = `${Math.max(13, Math.floor(barHeight * 0.24))}px sans-serif`;
        ctx.fillText(
          '✓ Direct Camera Snapshot - Panchmahal Godhra',
          24,
          canvas.height - (barHeight * 0.18)
        );

        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(photoDataUrl);
        setCapturedCoords(coords);
        setCapturedTimestamp(now.toISOString());
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          applyWatermark({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        _err => {
          applyWatermark(initialCoords || { lat: 22.7758, lng: 73.6149 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      applyWatermark(initialCoords || { lat: 22.7758, lng: 73.6149 });
    }
  };

  const takeLiveSnapshot = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      stampAndSave(videoRef.current);
    } else {
      openNativeCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedCoords(null);
    setCapturedTimestamp(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage && capturedCoords && capturedTimestamp) {
      onCapture(capturedImage, capturedCoords, capturedTimestamp);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between overflow-hidden">
      {/* Hidden native camera capture input (100% Android hardware support) */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        className="hidden"
        onChange={handleNativeFileChange}
      />

      {/* Top Glass Control Bar */}
      <div className="w-full max-w-md px-5 pt-8 pb-3 flex items-center justify-between text-white z-20">
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 active:scale-95 transition"
          aria-label="Close camera"
        >
          <X className="w-6 h-6" />
        </button>

        <span className="text-xs font-semibold uppercase tracking-wider bg-black/60 px-3 py-1 rounded-full text-[#6DB36F] border border-[#6DB36F]/40 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.cameraOnlyTitle}</span>
        </span>

        <button
          onClick={() => setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'))}
          className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 active:scale-95 transition"
          aria-label="Flip camera"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Main Viewfinder OR Permission Request Dialog */}
      <div className="relative w-full max-w-md flex-1 flex items-center justify-center px-6">
        {hasPermission === false && !capturedImage ? (
          // Camera Fallback & Native Camera Trigger Card
          <div className="w-full bg-[#16221B] rounded-[28px] p-6 text-center border border-[#6DB36F]/40 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#1B7A3F]/30 text-[#6DB36F] flex items-center justify-center animate-pulse">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {t.cameraPermissionTitle}
              </h3>
              <p className="text-xs text-[#A0B8A6] mt-2 leading-relaxed">
                {t.cameraPermissionDesc}
              </p>
            </div>

            {errorMsg && (
              <p className="text-xs text-[#E4F1DF] bg-[#1F3A2A] p-2.5 rounded-xl border border-[#6DB36F]/30">
                {errorMsg}
              </p>
            )}

            <div className="w-full flex flex-col gap-2 mt-2">
              <button
                onClick={openNativeCamera}
                className="w-full h-14 rounded-full bg-[#6DB36F] hover:bg-[#5FA361] text-[#111A14] font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition shadow-lg"
              >
                <Smartphone className="w-5 h-5" />
                <span>{lang === 'gu' ? 'ફોનનો કેમેરો ખોલો' : '📸 Open Phone Camera'}</span>
              </button>

              <button
                onClick={startCamera}
                disabled={cameraLoading}
                className="w-full h-11 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center justify-center gap-2 active:scale-95 transition"
              >
                {cameraLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#6DB36F]" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>{lang === 'gu' ? 'ફરી પ્રયાસ કરો' : 'Retry Live Viewfinder'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : capturedImage ? (
          // Captured Preview
          <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden border-2 border-white/20 shadow-2xl bg-neutral-900">
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white flex items-center gap-1.5 border border-[#6DB36F]/40">
              <Check className="w-3.5 h-3.5 text-[#6DB36F]" />
              <span>{t.verified}</span>
            </div>
          </div>
        ) : (
          // Live Video Stream with Corner Brackets
          <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden bg-neutral-900 flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />

            {/* Corner Brackets Overlay */}
            <div className="absolute inset-4 pointer-events-none">
              <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-xl" />
            </div>

            {/* Center target guide */}
            <div className="w-12 h-12 rounded-full border border-white/40 flex items-center justify-center pointer-events-none">
              <div className="w-2 h-2 rounded-full bg-white/70" />
            </div>

            {cameraLoading && (
              <div className="absolute inset-0 bg-neutral-900/90 flex flex-col items-center justify-center text-white gap-2">
                <RefreshCw className="w-8 h-8 animate-spin text-[#6DB36F]" />
                <span className="text-sm">Starting camera...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notice Tag */}
      <div className="w-full max-w-md px-6 text-center text-white/80 my-2">
        <p className="text-xs leading-relaxed text-[#B5CF8A]">
          {t.cameraOnlyNotice}
        </p>
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-md px-6 pb-8 pt-2 flex flex-col items-center gap-3">
        {capturedImage ? (
          <div className="w-full flex gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 h-14 rounded-full border-2 border-white/30 text-white font-medium hover:bg-white/10 active:scale-95 transition"
            >
              {t.retake}
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 h-14 rounded-full bg-[#1B7A3F] hover:bg-[#146B3A] text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition shadow-lg"
            >
              <Check className="w-5 h-5" />
              {t.usePhoto}
            </button>
          </div>
        ) : hasPermission ? (
          <div className="w-full flex flex-col gap-2.5">
            <button
              onClick={takeLiveSnapshot}
              className="w-full h-14 rounded-full bg-white text-[#111A14] font-semibold text-lg flex items-center justify-center gap-2 active:scale-95 transition shadow-2xl"
            >
              <span>{t.takePhoto}</span>
              <Camera className="w-5 h-5 text-[#111A14]" />
            </button>

            {/* Secondary Option: Launch Native Camera */}
            <button
              onClick={openNativeCamera}
              className="text-xs text-white/70 hover:text-white flex items-center justify-center gap-1.5 py-1"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{lang === 'gu' ? 'ફોન કેમેરા એપ્લિકેશન વાપરો' : 'Switch to Phone Camera App'}</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
