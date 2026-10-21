import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, AlertCircle, Video } from 'lucide-react';
import { createSamplePhoto } from '../utils/sampleImages';

interface WebcamViewProps {
  isCapturing: boolean;
  countdown: number | null;
  flashActive: boolean;
  mirror: boolean;
  filterStyle: string;
  onSnapshot: (dataUrl: string) => void;
  triggerSnap: boolean;
  samplePoseIndex: number;
}

export const WebcamView: React.FC<WebcamViewProps> = ({
  countdown,
  flashActive,
  mirror,
  filterStyle,
  onSnapshot,
  triggerSnap,
  samplePoseIndex,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [useSimulation, setUseSimulation] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available in this browser environment');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
        setHasPermission(true);
        setUseSimulation(false);
      }
    } catch (err: unknown) {
      console.warn('Camera access denied or unavailable, using studio simulator:', err);
      setHasPermission(false);
      setUseSimulation(true);
      setCameraError(err instanceof Error ? err.message : 'Webcam permission denied');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  // Capture frame when triggerSnap changes to true
  useEffect(() => {
    if (!triggerSnap) return;

    if (useSimulation || !streamActive || !videoRef.current) {
      // Use generator snapshot
      const sampleUrl = createSamplePhoto(samplePoseIndex);
      onSnapshot(sampleUrl);
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      if (mirror) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      onSnapshot(dataUrl);
    }
  }, [triggerSnap, useSimulation, streamActive, mirror, onSnapshot, samplePoseIndex]);

  return (
    <div className="relative w-full h-full min-h-[420px] bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-neutral-800 shadow-2xl">
      {/* 1. Live Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ filter: filterStyle }}
        className={`w-full h-full object-cover transition-transform duration-200 ${
          mirror ? 'scale-x-[-1]' : ''
        } ${useSimulation ? 'hidden' : 'block'}`}
      />

      {/* 2. Simulation / Studio Fallback Mode */}
      {useSimulation && (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-radial from-neutral-900 to-black p-8 text-center">
          <div className="relative mb-6">
            <img
              src={createSamplePhoto(samplePoseIndex)}
              alt="Simulated Camera Pose"
              style={{ filter: filterStyle }}
              className="w-72 h-72 sm:w-88 sm:h-88 rounded-2xl object-cover shadow-2xl border-2 border-neutral-700"
            />
            <div className="absolute top-3 left-3 bg-neutral-950/80 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-mono text-amber-400 border border-amber-400/20">
              STUDIO TEST CAM · POSE #{samplePoseIndex + 1}
            </div>
          </div>

          <p className="text-sm text-neutral-400 max-w-sm">
            Webcam access not detected. Running high-res Studio Sample simulation mode so you can test full capture & print flows!
          </p>

          <button
            onClick={startCamera}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors border border-neutral-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Webcam Connection
          </button>
        </div>
      )}

      {/* Top Overlay: Camera Status */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-neutral-950/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-800 text-xs font-mono">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        <span className="text-neutral-300 font-medium">
          {useSimulation ? 'STUDIO CAM (VIRTUAL)' : 'DIRECTSHOW 1080P'}
        </span>
        <span className="text-neutral-600">|</span>
        <span className="text-neutral-400">30 FPS</span>
      </div>

      {/* Mode Switcher Pill */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => {
            if (useSimulation) {
              startCamera();
            } else {
              setUseSimulation(true);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950/80 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-full text-xs border border-neutral-800 transition-colors"
        >
          {useSimulation ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <Camera className="w-3.5 h-3.5 text-amber-400" />}
          <span>{useSimulation ? 'Use Real Webcam' : 'Use Test Simulator'}</span>
        </button>
      </div>

      {/* 3. Countdown Number Overlay */}
      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] z-20">
          <div className="relative">
            <span className="text-8xl sm:text-9xl font-black text-white tracking-tighter drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] animate-bounce font-mono">
              {countdown}
            </span>
          </div>
          <span className="mt-4 text-xl sm:text-2xl font-bold text-amber-300 tracking-wide uppercase drop-shadow-md">
            Look at the Camera & Smile!
          </span>
        </div>
      )}

      {/* 4. Fullscreen Camera Flash Whiteout */}
      <div
        className={`absolute inset-0 bg-white pointer-events-none z-30 transition-opacity duration-300 ${
          flashActive ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
