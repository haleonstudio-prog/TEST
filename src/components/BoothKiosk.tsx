import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, RotateCcw, Printer, Download, QrCode, Sparkles, 
  Layers, Palette, Wand2, Plus, Trash2, CheckCircle2 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WebcamView } from './WebcamView';
import { 
  FilterType, FrameTheme, LayoutFormat, PhotoboothSettings, 
  SessionPhoto, StickerItem, HistoryStrip, LayoutTemplate 
} from '../types';
import { soundManager } from '../utils/audio';
import { renderPhotoboothStrip, getCanvasFilterString, THEME_COLORS } from '../utils/stripGenerator';

interface BoothKioskProps {
  settings: PhotoboothSettings;
  onSaveToGallery: (strip: HistoryStrip) => void;
  onOpenQR: (dataUrl: string) => void;
  customTemplate?: LayoutTemplate;
  onBackToEvents?: () => void;
}

const STICKER_LIBRARY = [
  { label: '🕶️ Sunglasses', content: '🕶️' },
  { label: '👑 Crown', content: '👑' },
  { label: '🎩 Top Hat', content: '🎩' },
  { label: '🥸 Mustache', content: '🥸' },
  { label: '🥳 Party Hat', content: '🥳' },
  { label: '✨ Sparkles', content: '✨' },
  { label: '💖 Love Hearts', content: '💖' },
  { label: '🐱 Cat Ears', content: '🐱' },
  { label: '⭐ Gold Star', content: '⭐' },
  { label: '🔥 Fire', content: '🔥' },
  { label: '📸 Camera', content: '📸' },
  { label: '🥂 Cheers', content: '🥂' },
];

export const BoothKiosk: React.FC<BoothKioskProps> = ({
  settings,
  onSaveToGallery,
  onOpenQR,
  customTemplate,
  onBackToEvents,
}) => {
  // Session flow states
  const [sessionPhase, setSessionPhase] = useState<'idle' | 'countdown' | 'review'>('idle');
  const [currentTakeIndex, setCurrentTakeIndex] = useState<number>(0);
  const [targetPhotoCount, setTargetPhotoCount] = useState<number>(
    customTemplate ? customTemplate.layers.filter(l => l.type === 'photo_slot').length || 3 : 4
  );
  const [format, setFormat] = useState<LayoutFormat>('strip-4');
  const [capturedPhotos, setCapturedPhotos] = useState<SessionPhoto[]>([]);
  
  // Customization states
  const [activeFilter, setActiveFilter] = useState<FilterType>('normal');
  const [activeTheme, setActiveTheme] = useState<FrameTheme>('classic-white');
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [customText, setCustomText] = useState<string>('');

  // Camera & Trigger states
  const [countdownNum, setCountdownNum] = useState<number | null>(null);
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const [triggerSnap, setTriggerSnap] = useState<boolean>(false);
  const [stripDataUrl, setStripDataUrl] = useState<string>('');
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [printSuccessNotice, setPrintSuccessNotice] = useState<string | null>(null);

  // Set target photo count based on custom template or layout format
  useEffect(() => {
    if (customTemplate) {
      const slots = customTemplate.layers.filter(l => l.type === 'photo_slot');
      if (slots.length > 0) {
        setTargetPhotoCount(slots.length);
        return;
      }
    }
    if (format === 'strip-4' || format === 'grid-2x2' || format === 'gif-burst') {
      setTargetPhotoCount(4);
    } else if (format === 'strip-3') {
      setTargetPhotoCount(3);
    } else if (format === 'single') {
      setTargetPhotoCount(1);
    }
  }, [customTemplate, format]);

  // Start a fresh photobooth session
  const startSession = () => {
    setCapturedPhotos([]);
    setStickers([]);
    setCurrentTakeIndex(0);
    setSessionPhase('countdown');
    startCountdownForTake(0);
  };

  // Start countdown for a specific take
  const startCountdownForTake = (takeIndex: number) => {
    setCurrentTakeIndex(takeIndex);
    let count = settings.countdownSeconds || 3;
    setCountdownNum(count);

    if (settings.soundEnabled) {
      soundManager.playCountdownBeep(false);
    }

    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNum(count);
        if (settings.soundEnabled) {
          soundManager.playCountdownBeep(false);
        }
      } else {
        clearInterval(interval);
        setCountdownNum(null);
        // Trigger capture
        if (settings.soundEnabled) {
          soundManager.playCountdownBeep(true);
        }
        triggerCameraCapture();
      }
    }, 1000);
  };

  // Trigger flash and snap
  const triggerCameraCapture = () => {
    if (settings.flashEnabled) {
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 250);
    }
    if (settings.soundEnabled) {
      soundManager.playShutterSound();
    }
    setTriggerSnap(true);
  };

  // Snapshot handler from WebcamView
  const handleSnapshot = useCallback((dataUrl: string) => {
    setTriggerSnap(false);
    const newPhoto: SessionPhoto = {
      id: `photo-${Date.now()}-${Math.random()}`,
      dataUrl,
      timestamp: Date.now(),
    };

    setCapturedPhotos((prev) => {
      const updated = [...prev, newPhoto];
      if (updated.length < targetPhotoCount) {
        // Next take after brief pause
        setTimeout(() => {
          startCountdownForTake(updated.length);
        }, 1200);
      } else {
        // All photos captured! Transition to review
        setTimeout(() => {
          setSessionPhase('review');
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
            });
          } catch {
            // ignore
          }
        }, 600);
      }
      return updated;
    });
  }, [targetPhotoCount, settings]);

  // Render composite strip whenever filter, theme, or stickers change in review
  useEffect(() => {
    if (sessionPhase !== 'review' || capturedPhotos.length === 0) return;

    let isMounted = true;
    setIsRendering(true);

    renderPhotoboothStrip(
      capturedPhotos,
      format,
      activeFilter,
      activeTheme,
      settings,
      stickers,
      customTemplate
    ).then((url) => {
      if (isMounted) {
        setStripDataUrl(url);
        setIsRendering(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [sessionPhase, capturedPhotos, format, activeFilter, activeTheme, settings, stickers, customTemplate]);

  // Add a sticker
  const handleAddSticker = (content: string, type: 'emoji' | 'text' = 'emoji') => {
    const newSticker: StickerItem = {
      id: `sticker-${Date.now()}`,
      type,
      content,
      x: 35 + Math.random() * 30,
      y: 20 + Math.random() * 50,
      scale: 1,
      rotation: Math.round((Math.random() - 0.5) * 30),
    };
    setStickers((prev) => [...prev, newSticker]);
  };

  // Print Action
  const handlePrint = () => {
    if (settings.soundEnabled) {
      soundManager.playPrinterSpool();
    }
    setPrintSuccessNotice(`Sent ${settings.copiesPerSession || 1} copies to Windows Spooler [${settings.printerName || 'Default 2x6 Printer'}]`);
    setTimeout(() => setPrintSuccessNotice(null), 4000);

    // Save to gallery history
    if (stripDataUrl) {
      onSaveToGallery({
        id: `strip-${Date.now()}`,
        timestamp: Date.now(),
        previewUrl: stripDataUrl,
        format,
        filter: activeFilter,
        theme: activeTheme,
        photoCount: capturedPhotos.length,
      });
    }

    // Trigger window.print
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Download Action
  const handleDownload = () => {
    if (!stripDataUrl) return;
    const a = document.createElement('a');
    a.href = stripDataUrl;
    a.download = `photobooth_${settings.eventTitle.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Save to gallery
    onSaveToGallery({
      id: `strip-${Date.now()}`,
      timestamp: Date.now(),
      previewUrl: stripDataUrl,
      format,
      filter: activeFilter,
      theme: activeTheme,
      photoCount: capturedPhotos.length,
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      {/* Printable element for 300DPI physical photostrip printing */}
      <div id="printable-photostrip" className="hidden">
        {stripDataUrl && (
          <img src={stripDataUrl} alt="Photobooth Strip Print" className="w-full h-auto" />
        )}
      </div>

      {/* Top back navigation to Saved Events */}
      {onBackToEvents && sessionPhase === 'idle' && (
        <div className="w-full max-w-4xl flex items-center justify-between mb-4">
          <button
            onClick={onBackToEvents}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-xs font-medium text-neutral-300 transition-colors"
          >
            <span>&larr; Back to Saved Events</span>
          </button>
          {customTemplate && (
            <div className="text-xs font-mono text-pink-400 bg-pink-950/40 border border-pink-800/40 px-3 py-1 rounded-full">
              Template: {customTemplate.name} ({targetPhotoCount} poses)
            </div>
          )}
        </div>
      )}

      {/* PHASE 1: IDLE / WELCOME SCREEN */}
      {sessionPhase === 'idle' && (
        <div className="w-full max-w-4xl flex flex-col items-center text-center py-6">
          {/* Event Header */}
          <div className="mb-6">
            <span className="text-xs font-mono uppercase tracking-widest text-rose-400 font-semibold">
              Live Photobooth Kiosk
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-1 tracking-tight">
              {settings.eventTitle || 'PHOTOBOOTH STUDIO'}
            </h1>
            <p className="text-sm sm:text-base text-neutral-400 mt-2 max-w-lg mx-auto">
              {settings.eventSubtitle || 'Step into the booth, strike your best poses, and take home custom photo prints!'}
            </p>
          </div>

          {/* Strip Format Selector */}
          <div className="w-full max-w-2xl bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 mb-8 text-left shadow-xl">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-3">
              1. Select Strip Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'strip-4', label: 'Classic 4-Strip', desc: '4 vertical poses (2x6")' },
                { id: 'strip-3', label: 'Retro 3-Strip', desc: '3 vertical poses (2x6")' },
                { id: 'grid-2x2', label: '2x2 Postcard', desc: '4 grid poses (4x6")' },
                { id: 'single', label: 'Single Portrait', desc: '1 large glamour shot' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFormat(opt.id as LayoutFormat)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    format === opt.id
                      ? 'bg-rose-500/10 border-rose-500 text-white shadow-sm'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-semibold text-xs sm:text-sm text-neutral-200">{opt.label}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Giant Touch Button */}
          <button
            onClick={startSession}
            className="group relative inline-flex items-center gap-4 px-10 py-6 sm:px-14 sm:py-7 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-extrabold text-xl sm:text-2xl tracking-wide shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Play className="w-8 h-8 fill-current transition-transform group-hover:scale-110" />
            <span>TOUCH SCREEN TO START</span>
          </button>

          <div className="flex items-center gap-4 text-xs text-neutral-500 mt-6 font-mono">
            <span>DirectShow 1080P Camera</span>
            <span>·</span>
            <span>{targetPhotoCount} Poses Sequence</span>
            <span>·</span>
            <span>Windows Spooler Ready</span>
          </div>
        </div>
      )}

      {/* PHASE 2: CAMERA COUNTDOWN & CAPTURE SCREEN */}
      {sessionPhase === 'countdown' && (
        <div className="w-full max-w-4xl flex flex-col items-center">
          {/* Status Indicator */}
          <div className="w-full flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-lg font-bold text-white tracking-tight">
                Pose {currentTakeIndex + 1} of {targetPhotoCount}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: targetPhotoCount }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    idx < capturedPhotos.length
                      ? 'bg-rose-500 border-rose-500'
                      : idx === currentTakeIndex
                      ? 'bg-amber-400 border-amber-400 animate-ping'
                      : 'border-neutral-700 bg-neutral-900'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Viewfinder Frame */}
          <div className="w-full aspect-4/3 max-h-[580px]">
            <WebcamView
              isCapturing={true}
              countdown={countdownNum}
              flashActive={flashActive}
              mirror={settings.mirrorCamera}
              filterStyle={getCanvasFilterString(activeFilter)}
              onSnapshot={handleSnapshot}
              triggerSnap={triggerSnap}
              samplePoseIndex={currentTakeIndex}
            />
          </div>

          <div className="mt-4 text-center">
            <p className="text-neutral-400 text-sm">
              Strike a fun pose! Photos take automatically after each countdown.
            </p>
          </div>
        </div>
      )}

      {/* PHASE 3: REVIEW & CUSTOMIZATION STUDIO */}
      {sessionPhase === 'review' && (
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Strip Preview */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Photo Strip Preview
              </span>
              {isRendering && (
                <span className="text-xs font-mono text-amber-400 animate-pulse">
                  Rendering filters...
                </span>
              )}
            </div>

            {/* High Res Strip Canvas Preview Container */}
            <div className="relative bg-neutral-950 p-4 rounded-2xl border border-neutral-800 shadow-2xl flex items-center justify-center max-h-[720px] overflow-hidden">
              {stripDataUrl ? (
                <img
                  src={stripDataUrl}
                  alt="Custom Photobooth Strip"
                  className="max-h-[640px] w-auto rounded-lg shadow-md object-contain"
                />
              ) : (
                <div className="w-64 h-96 flex items-center justify-center text-neutral-500 text-xs">
                  Generating Composite...
                </div>
              )}
            </div>

            {/* Print feedback notice */}
            {printSuccessNotice && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs rounded-xl shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{printSuccessNotice}</span>
              </div>
            )}
          </div>

          {/* Right Column: Customization Controls & Actions */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Action Bar */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-wrap gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-5 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 text-sm sm:text-base cursor-pointer"
              >
                <Printer className="w-5 h-5" />
                <span>Print Strip</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl transition-all border border-neutral-700 text-sm active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Save PNG</span>
              </button>

              <button
                onClick={() => stripDataUrl && onOpenQR(stripDataUrl)}
                className="flex items-center justify-center gap-2 px-4 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-semibold rounded-xl transition-all border border-neutral-700 text-sm active:scale-95 cursor-pointer"
                title="Generate QR code for smartphone download"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">Phone QR</span>
              </button>

              <button
                onClick={startSession}
                className="flex items-center justify-center gap-2 px-4 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-xl transition-all border border-neutral-700 text-sm active:scale-95 cursor-pointer"
                title="Retake session"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake</span>
              </button>
            </div>

            {/* 1. Filter Selection */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Photo Filter & Tone
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'normal', name: 'Original' },
                  { id: 'warm-vintage', name: 'Vintage 70s' },
                  { id: 'bw-contrast', name: 'B&W Contrast' },
                  { id: 'tokyo-pastel', name: 'Tokyo Pastel' },
                  { id: 'cyber-neon', name: 'Cyber Neon' },
                  { id: 'sepia', name: 'Antique Sepia' },
                  { id: 'soft-glow', name: 'Glamour Glow' },
                  { id: 'film-grain', name: '35mm Film' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id as FilterType)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                      activeFilter === f.id
                        ? 'bg-rose-500/10 border-rose-500 text-white font-semibold shadow-xs'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Frame Theme Selection */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Frame Color & Paper Style
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'classic-white', name: 'Classic White', color: '#FFFFFF' },
                  { id: 'matte-black', name: 'Matte Black', color: '#18181B' },
                  { id: 'vintage-cream', name: 'Vintage Cream', color: '#FAF5EE' },
                  { id: 'blush-pink', name: 'Blush Pink', color: '#FDF2F8' },
                  { id: 'midnight-navy', name: 'Midnight Navy', color: '#0F172A' },
                  { id: 'cyber-purple', name: 'Cyber Indigo', color: '#1E1B4B' },
                  { id: 'golden-hour', name: 'Golden Hour', color: '#FEF3C7' },
                  { id: 'checkerboard', name: 'Checkerboard', color: '#09090B' },
                ].map((thm) => (
                  <button
                    key={thm.id}
                    onClick={() => setActiveTheme(thm.id as FrameTheme)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                      activeTheme === thm.id
                        ? 'bg-amber-500/10 border-amber-500 text-white font-semibold shadow-xs'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-neutral-700 shadow-xs shrink-0"
                      style={{ backgroundColor: thm.color }}
                    />
                    <span className="truncate">{thm.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Fun Digital Props & Stickers */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                    Digital Props & Stickers
                  </h3>
                </div>
                {stickers.length > 0 && (
                  <button
                    onClick={() => setStickers([])}
                    className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Props</span>
                  </button>
                )}
              </div>

              {/* Sticker Buttons */}
              <div className="flex flex-wrap gap-2 mb-3">
                {STICKER_LIBRARY.map((stk, i) => (
                  <button
                    key={i}
                    onClick={() => handleAddSticker(stk.content, 'emoji')}
                    className="px-2.5 py-1.5 bg-neutral-950/70 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>{stk.content}</span>
                    <span className="text-[11px] text-neutral-400">{stk.label.split(' ')[1]}</span>
                  </button>
                ))}
              </div>

              {/* Add Custom Text Badge */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add custom text stamp (e.g. BFFs! #Party2026)"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customText.trim()) {
                      handleAddSticker(customText.trim(), 'text');
                      setCustomText('');
                    }
                  }}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-rose-500"
                />
                <button
                  onClick={() => {
                    if (customText.trim()) {
                      handleAddSticker(customText.trim(), 'text');
                      setCustomText('');
                    }
                  }}
                  disabled={!customText.trim()}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {stickers.length > 0 && (
                <p className="text-[11px] text-neutral-500 mt-2 font-mono">
                  {stickers.length} prop(s) placed on your photostrip.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
