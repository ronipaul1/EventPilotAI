import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Camera,
  Upload,
  Keyboard,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCw,
  Users,
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import type { GuestItem, EventItem } from '../types';
import { parseQrData, playScanSound, generateTicketCode } from '../utils/qrPass';

interface QrCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  guests: GuestItem[];
  onCheckInGuest: (guestId: string) => Promise<void>;
}

interface ScanResultState {
  type: 'success' | 'duplicate' | 'error' | null;
  guest?: GuestItem;
  message: string;
  ticketCode?: string;
  timestamp: string;
}

export const QrCodeScannerModal: React.FC<QrCodeScannerModalProps> = ({
  isOpen,
  onClose,
  event,
  guests,
  onCheckInGuest,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isIframeBlocked, setIsIframeBlocked] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [isGeneratingSample, setIsGeneratingSample] = useState<boolean>(false);

  // Scanner status & history
  const [lastScanResult, setLastScanResult] = useState<ScanResultState | null>(null);
  const [sessionScanned, setSessionScanned] = useState<Array<{ guest: GuestItem; time: string }>>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping camera track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Process and Authenticate Scanned Text
  const authenticatePass = useCallback(
    async (scannedRaw: string) => {
      if (!event || isProcessingRef.current) return;
      isProcessingRef.current = true;

      const parsed = parseQrData(scannedRaw);
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Find matching guest in the active event
      const matchedGuest = guests.find((g) => {
        if (parsed?.ticketCode && g.ticketCode && g.ticketCode.toUpperCase() === parsed.ticketCode.toUpperCase()) {
          return true;
        }
        if (parsed?.guestId && g.id === parsed.guestId) {
          return true;
        }
        if (g.ticketCode && scannedRaw.toUpperCase().includes(g.ticketCode.toUpperCase())) {
          return true;
        }
        if (g.id === scannedRaw.trim()) {
          return true;
        }
        return false;
      });

      if (!matchedGuest) {
        // Unrecognized / Invalid Pass
        if (soundEnabled) playScanSound('error');
        setLastScanResult({
          type: 'error',
          message: 'ACCESS DENIED: Unrecognized or invalid ticket code for this event.',
          ticketCode: parsed?.ticketCode || scannedRaw.slice(0, 24),
          timestamp: nowStr,
        });
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 1800);
        return;
      }

      // Check if this pass was already checked in
      if (matchedGuest.checkInStatus === 'checked_in') {
        if (soundEnabled) playScanSound('warning');
        setLastScanResult({
          type: 'duplicate',
          guest: matchedGuest,
          message: `DUPLICATE PASS: ${matchedGuest.name} was already admitted at ${matchedGuest.checkInTime ? new Date(matchedGuest.checkInTime).toLocaleTimeString() : 'earlier'}.`,
          ticketCode: matchedGuest.ticketCode,
          timestamp: nowStr,
        });
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 2000);
        return;
      }

      // Valid & New Check-In!
      if (soundEnabled) playScanSound('success');
      try {
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#f59e0b', '#38bdf8'],
        });
      } catch {
        // Confetti fallback
      }

      setLastScanResult({
        type: 'success',
        guest: matchedGuest,
        message: `ACCESS GRANTED: Welcome, ${matchedGuest.name}! (Admit Party of ${1 + (matchedGuest.plusOnes || 0)})`,
        ticketCode: matchedGuest.ticketCode,
        timestamp: nowStr,
      });

      setSessionScanned((prev) => [{ guest: matchedGuest, time: nowStr }, ...prev.slice(0, 19)]);

      try {
        await onCheckInGuest(matchedGuest.id);
      } catch (err) {
        console.error('Failed to commit check-in update to Firestore:', err);
      }

      setTimeout(() => {
        isProcessingRef.current = false;
      }, 2500);
    },
    [event, guests, soundEnabled, onCheckInGuest]
  );

  // Continuous Camera QR frame scanning loop
  const scanVideoFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data && !isProcessingRef.current) {
          authenticatePass(code.data);
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  }, [authenticatePass]);

  // Enumerate video devices
  const updateDeviceList = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoInputs);
    } catch {
      // Ignore enumeration error
    }
  }, []);

  // Progressive Camera Initialization with robust constraint fallbacks
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setIsIframeBlocked(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API (getUserMedia) is not supported or is disabled in this browser context.');
      setIsIframeBlocked(isInIframe);
      return;
    }

    let stream: MediaStream | null = null;
    let lastError: any = null;

    // Constraint Strategy 1: Specific device if selected
    if (selectedDeviceId) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: selectedDeviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (err: any) {
        console.warn('Specific device constraint failed, falling back...', err);
        lastError = err;
      }
    }

    // Constraint Strategy 2: Ideal facing mode with ideal resolution
    if (!stream) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: cameraFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (err: any) {
        console.warn('Ideal facing with resolution failed, trying basic ideal facing...', err);
        lastError = err;
      }
    }

    // Constraint Strategy 3: Basic ideal facingMode (no resolution constraint)
    if (!stream) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: cameraFacing },
          },
          audio: false,
        });
      } catch (err: any) {
        console.warn('Ideal facing failed, trying generic video...', err);
        lastError = err;
      }
    }

    // Constraint Strategy 4: Generic video (works with single webcam/PC webcam)
    if (!stream) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err: any) {
        console.warn('Generic video constraint failed:', err);
        lastError = err;
      }
    }

    if (stream) {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Error initiating video playback:', playErr);
        }
        animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      }
      updateDeviceList();
    } else {
      const errName = lastError?.name || '';
      const isDenied = errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errName === 'SecurityError';
      setIsIframeBlocked(isInIframe && isDenied);

      if (isDenied) {
        setCameraError(
          isInIframe
            ? 'Camera access is restricted inside the embedded preview iframe. Open the standalone scanner tab or use the File Upload / Manual Code Entry tab.'
            : 'Camera permission was denied. Please allow camera permissions in your browser URL settings or use File Upload / Manual Code Entry.'
        );
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setCameraError('No camera device was detected on your system. Please connect a webcam or use the File Upload / Manual Entry tab.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setCameraError('Your camera is currently in use by another application or tab. Please close other camera apps and retry.');
      } else {
        setCameraError('Could not access camera hardware. Try switching camera or use File Upload / Manual Entry.');
      }
    }
  }, [cameraFacing, selectedDeviceId, isInIframe, scanVideoFrame, stopCamera, updateDeviceList]);

  // Handle open/close and tab changes
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, cameraFacing, selectedDeviceId, startCamera, stopCamera]);

  // Uploaded Image Scanner
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        authenticatePass(code.data);
      } else {
        if (soundEnabled) playScanSound('error');
        setLastScanResult({
          type: 'error',
          message: 'No readable QR Code detected in uploaded image. Please try a higher-contrast photo or enter the ticket code manually.',
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    };
    img.src = URL.createObjectURL(file);
  };

  // Generate & Test Sample Pass in Upload Tab
  const handleTestSamplePass = async () => {
    if (!event || guests.length === 0) return;
    setIsGeneratingSample(true);
    try {
      // Pick the first guest who is not yet checked in, or first guest
      const targetGuest = guests.find((g) => g.checkInStatus !== 'checked_in') || guests[0];
      const ticketCode = targetGuest.ticketCode || generateTicketCode(event.id, targetGuest.id);

      const payload = JSON.stringify({
        app: 'EventPilotAI',
        version: '1.0',
        ticketCode,
        guestId: targetGuest.id,
        eventId: event.id,
        name: targetGuest.name,
        plusOnes: targetGuest.plusOnes || 0,
      });

      const dataUrl = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'M',
        width: 320,
      });

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          authenticatePass(code.data);
        }
        setIsGeneratingSample(false);
      };
      img.src = dataUrl;
    } catch (err) {
      console.error('Error generating sample pass:', err);
      setIsGeneratingSample(false);
    }
  };

  // Manual code submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    authenticatePass(manualCodeInput.trim());
    setManualCodeInput('');
  };

  // Open standalone tab outside iframe
  const handleOpenStandalone = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('openScanner', 'true');
      url.hash = '#scanner';
      window.open(url.toString(), '_blank');
    } catch {
      window.open(window.location.href, '_blank');
    }
  };

  // Copy direct link for mobile/tablet scanning
  const handleCopyDirectLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('openScanner', 'true');
      url.hash = '#scanner';
      await navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  if (!isOpen) return null;

  // Real-time Check-In Statistics
  const confirmedAttending = guests.filter((g) => g.rsvpStatus === 'attending');
  const checkedInCount = guests.filter((g) => g.checkInStatus === 'checked_in').length;
  const totalHeadcountCheckedIn = guests
    .filter((g) => g.checkInStatus === 'checked_in')
    .reduce((sum, g) => sum + 1 + (g.plusOnes || 0), 0);
  const totalExpectedHeadcount = confirmedAttending.reduce((sum, g) => sum + 1 + (g.plusOnes || 0), 0);
  const checkInRate = confirmedAttending.length > 0 ? Math.round((checkedInCount / confirmedAttending.length) * 100) : 0;

  // Recent 5 attending guests for 1-click test admission chips
  const sampleTestGuests = guests.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fade-in text-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-900 dark:text-slate-100 my-8">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Event Entry Authentication
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 text-[10px] font-bold">
                  Live Scanner
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Organizer QR Entry Scanner
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
              title={soundEnabled ? 'Mute Audio Chime' : 'Enable Audio Chime'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-500" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Attendance Headcount Counter */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-extrabold text-xs">
              {checkInRate}%
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                {checkedInCount} of {confirmedAttending.length} parties admitted
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Total admitted headcount: <strong className="text-emerald-600 dark:text-emerald-400">{totalHeadcountCheckedIn}</strong> of {totalExpectedHeadcount} expected plates
              </span>
            </div>
          </div>

          <div className="w-32 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${checkInRate}%` }}
            />
          </div>
        </div>

        {/* Tab Controls: Camera vs Upload vs Manual */}
        <div className="mt-4 flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'camera'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'upload'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload QR Image</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'manual'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Manual Code Entry</span>
          </button>
        </div>

        {/* Scanner Viewport Area */}
        <div className="mt-4">
          {/* TAB 1: LIVE CAMERA */}
          {activeTab === 'camera' && (
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 min-h-[260px] flex items-center justify-center border border-slate-800">
              {cameraError ? (
                <div className="p-6 text-center text-slate-300 space-y-3 max-w-md my-auto">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Camera Access Notice</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{cameraError}</p>
                  </div>

                  {/* Actions to unlock / bypass iframe block */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleOpenStandalone}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-sm transition-all text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Standalone Scanner Tab</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-1.5 text-xs transition-colors"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Retry Camera</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span>Or switch scanner mode:</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="text-amber-400 hover:underline font-semibold"
                    >
                      Upload File
                    </button>
                    <span>&bull;</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('manual')}
                      className="text-amber-400 hover:underline font-semibold"
                    >
                      Manual Entry
                    </button>
                    <span>&bull;</span>
                    <button
                      type="button"
                      onClick={handleCopyDirectLink}
                      className="text-amber-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Mobile Link'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full max-h-72 object-cover"
                    muted
                    playsInline
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Aiming Reticle Box with Animated Scanline */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-48 h-48 sm:w-52 sm:h-52 border-2 border-amber-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]">
                      {/* Corner Accents */}
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-amber-400" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-amber-400" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-amber-400" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-amber-400" />

                      {/* Laser Scanline */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_#f59e0b] animate-bounce mt-24" />
                    </div>
                  </div>

                  {/* Camera Controls Bar */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white">
                    <span className="bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                      Point camera at Guest Entry Pass
                    </span>
                    <div className="flex items-center gap-2">
                      {availableDevices.length > 1 && (
                        <select
                          value={selectedDeviceId}
                          onChange={(e) => setSelectedDeviceId(e.target.value)}
                          className="px-2 py-1 rounded-lg bg-slate-900/90 text-amber-400 font-semibold border border-slate-700 text-[10px]"
                        >
                          <option value="">Default Camera</option>
                          {availableDevices.map((dev, i) => (
                            <option key={dev.deviceId || i} value={dev.deviceId}>
                              {dev.label || `Camera ${i + 1}`}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'))
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-amber-400 font-semibold flex items-center gap-1"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Flip</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD QR IMAGE */}
          {activeTab === 'upload' && (
            <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-3">
              <Upload className="w-10 h-10 text-amber-500 mx-auto" />
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Drop QR Code Image Here
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Supports PNG, JPG, or screenshot files from WhatsApp / invitations
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <label className="inline-block px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer transition-colors shadow-xs">
                  <span>Select QR File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {guests.length > 0 && (
                  <button
                    type="button"
                    disabled={isGeneratingSample}
                    onClick={handleTestSamplePass}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isGeneratingSample ? 'Generating...' : '⚡ Test Scan Sample Pass'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL TICKET ENTRY */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Enter Ticket Pass Code or Guest ID:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  placeholder="e.g. EP-EVNT-ABCD-1234 or GST_..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs uppercase focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Verify & Admit
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 1-Click Interactive Pass Verification Bar */}
        {sampleTestGuests.length > 0 && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>Quick-Test Admission Passes (Click to Authenticate):</span>
              </span>
              <span className="text-[10px] text-slate-400">Verifies check-in, chime & headcount</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sampleTestGuests.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => authenticatePass(g.ticketCode || g.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1 ${
                    g.checkInStatus === 'checked_in'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 line-through'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-amber-500 hover:text-amber-500'
                  }`}
                  title={g.ticketCode}
                >
                  <span>{g.name}</span>
                  <span className="text-[10px] font-mono text-amber-500 dark:text-amber-400">
                    ({g.ticketCode ? g.ticketCode.slice(-4) : 'PASS'})
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => authenticatePass('EP-FAKE-INVALID-CODE')}
                className="px-2 py-1 rounded-lg text-[10px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                title="Test Invalid Code"
              >
                Test Invalid Pass
              </button>
            </div>
          </div>
        )}

        {/* Real-time Scan Result Banner */}
        {lastScanResult && (
          <div
            className={`mt-4 p-4 rounded-2xl border transition-all animate-fade-in ${
              lastScanResult.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                : lastScanResult.type === 'duplicate'
                ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-200'
                : 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-900 dark:text-rose-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {lastScanResult.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : lastScanResult.type === 'duplicate' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm block">
                    {lastScanResult.type === 'success'
                      ? 'Admit Guest'
                      : lastScanResult.type === 'duplicate'
                      ? 'Duplicate Scan'
                      : 'Verification Failed'}
                  </span>
                  <span className="text-[10px] opacity-75 font-mono">
                    {lastScanResult.timestamp}
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-medium leading-relaxed">
                  {lastScanResult.message}
                </p>

                {lastScanResult.guest && (
                  <div className="mt-2 pt-2 border-t border-current/15 flex flex-wrap items-center gap-3 text-[11px]">
                    <span>
                      Group: <strong className="capitalize">{lastScanResult.guest.group}</strong>
                    </span>
                    <span>
                      Table: <strong>{lastScanResult.guest.tableNumber || 'Unassigned'}</strong>
                    </span>
                    {lastScanResult.guest.dietaryRequirements && (
                      <span>Dietary: <strong>{lastScanResult.guest.dietaryRequirements}</strong></span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Session Scan History */}
        {sessionScanned.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Admitted in This Session ({sessionScanned.length})
            </span>
            <div className="max-h-28 overflow-y-auto space-y-1.5">
              {sessionScanned.map((item, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-slate-900 dark:text-white">{item.guest.name}</span>
                    <span className="text-slate-400 text-[10px]">
                      (Party of {1 + (item.guest.plusOnes || 0)})
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
