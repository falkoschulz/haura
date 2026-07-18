/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Sparkles, Sliders, Activity, Info } from 'lucide-react';

interface MotionSensingPanelProps {
  enabled: boolean;
  onToggle: (val: boolean) => void;
  sensitivity: number;
  onSensitivityChange: (val: number) => void;
  onMotionDetected: () => void;
}

export default function MotionSensingPanel({
  enabled,
  onToggle,
  sensitivity,
  onSensitivityChange,
  onMotionDetected
}: MotionSensingPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const requestRef = useRef<number | null>(null);

  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'active' | 'denied'>('idle');
  const [motionValue, setMotionValue] = useState<number>(0);
  const [isSimulatedWaveActive, setIsSimulatedWaveActive] = useState<boolean>(false);
  const [infoShown, setInfoShown] = useState<boolean>(false);

  // Stop camera stream helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    lastFrameDataRef.current = null;
    setCameraState('idle');
    setMotionValue(0);
  };

  // Start camera stream helper
  const startCamera = async () => {
    setCameraState('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 160, height: 120, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error("Video play failed:", e));
      }
      setCameraState('active');
    } catch (err) {
      console.warn("Camera access was denied or was unavailable:", err);
      setCameraState('denied');
    }
  };

  // Turn camera stream on/off depending on enabled prop
  useEffect(() => {
    if (enabled) {
      if (cameraState === 'idle' || cameraState === 'denied') {
        startCamera();
      }
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [enabled]);

  // Motion analysis loop
  useEffect(() => {
    if (cameraState !== 'active') return;

    const analyzeFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        requestRef.current = requestAnimationFrame(analyzeFrame);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        requestRef.current = requestAnimationFrame(analyzeFrame);
        return;
      }

      try {
        // Draw miniature video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const length = currentFrame.data.length;

        if (lastFrameDataRef.current) {
          const lastFrame = lastFrameDataRef.current;
          let diffSum = 0;
          let pixelCount = length / 4;

          // Check every 4th pixel to maximize performance
          for (let i = 0; i < length; i += 16) {
            const rDiff = Math.abs(currentFrame.data[i] - lastFrame[i]);
            const gDiff = Math.abs(currentFrame.data[i + 1] - lastFrame[i + 1]);
            const bDiff = Math.abs(currentFrame.data[i + 2] - lastFrame[i + 2]);
            // Convert to relative visual metric
            diffSum += (rDiff + gDiff + bDiff) / 3;
          }

          const averageDiff = diffSum / (pixelCount / 4);
          const scaledMotion = Math.min(100, Math.round(averageDiff * 2.5)); // visual scaling
          setMotionValue(scaledMotion);

          // If average visual change is above user sensitivity limit, register motion
          // High sensitivity value in settings means require low threshold (e.g. threshold = 100 - sensitivity)
          const targetThreshold = Math.max(2, 50 - sensitivity); 
          if (scaledMotion > targetThreshold) {
            onMotionDetected();
          }
        }

        // Store current frame as last frame template
        lastFrameDataRef.current = currentFrame.data;
      } catch (e) {
        // Graceful catch for offscreen render issues
      }

      requestRef.current = requestAnimationFrame(analyzeFrame);
    };

    requestRef.current = requestAnimationFrame(analyzeFrame);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [cameraState, sensitivity, onMotionDetected]);

  // Handle simulation of manual hand wave/motion
  const triggerSimulatedMotion = () => {
    if (isSimulatedWaveActive) return;
    setIsSimulatedWaveActive(true);
    
    let ticker = 0;
    const interval = setInterval(() => {
      ticker++;
      // Create raw waves on the visual widget
      const simVal = Math.round(40 + Math.sin(ticker) * 25 + Math.random() * 15);
      setMotionValue(simVal);
      onMotionDetected();

      if (ticker > 8) {
        clearInterval(interval);
        setMotionValue(0);
        setIsSimulatedWaveActive(false);
      }
    }, 150);
  };

  return (
    <div id="motion-detector-card" className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 mb-6 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Motion-Sensing Wake Engine
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Resets inactivity timeout dynamically using your camera feed.
          </p>
        </div>
        
        {/* Toggle Option */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            id="camera-motion-toggle"
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white"></div>
        </label>
      </div>

      {enabled ? (
        <div id="camera-sensing-workspace" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-950/80 p-3 rounded-xl border border-gray-800">
            
            {/* Miniature processing block */}
            <div className="flex flex-col items-center justify-center bg-gray-900 border border-gray-800 rounded-lg p-2 relative overflow-hidden aspect-video">
              {cameraState === 'starting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-amber-400 bg-gray-950 gap-2">
                  <div className="w-4.5 h-4.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  Starting Camera...
                </div>
              )}
              {cameraState === 'denied' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-xs text-red-400 bg-gray-950 px-2 gap-1">
                  <CameraOff className="w-5 h-5" />
                  Permission Refused
                </div>
              )}
              
              {/* Invisible video element running the user webcam stream */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover rounded opacity-40 scale-x-[-1]"
                muted
                playsInline
                width="160"
                height="120"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
                width="32"
                height="24"
              />
              
              <div className="absolute bottom-1.5 left-2 flex items-center gap-1.5 bg-black/80 px-2 py-0.5 rounded text-[10px] text-emerald-400 uppercase font-mono tracking-wider">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span>Camera Stream</span>
              </div>
            </div>

            {/* Sensitivity settings */}
            <div className="md:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-gray-300 mb-2">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-gray-400" />
                    Motion Sensitivity
                  </span>
                  <span className="text-emerald-400 font-mono">{sensitivity}%</span>
                </div>
                <input
                  id="motion-sensitivity-range"
                  type="range"
                  min="5"
                  max="45"
                  value={sensitivity}
                  onChange={(e) => onSensitivityChange(Number(e.target.value))}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1">
                  <span>Slow motion (More stable)</span>
                  <span>Light motion (Rapid alert)</span>
                </div>
              </div>

              {/* Feed metrics */}
              <div className="mt-3">
                <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                  <span>Active Frame Delta:</span>
                  <span className="font-mono text-gray-200">{motionValue}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 ${
                      motionValue > (50 - sensitivity) 
                        ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' 
                        : 'bg-emerald-800/40'
                    }`}
                    style={{ width: `${Math.min(100, (motionValue / (50 - sensitivity)) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-0.5">
                  <span>Idle Color</span>
                  <span className="text-emerald-400">Wake Threshold ({(50 - sensitivity).toFixed(0)}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Permission Denied Callout */}
          {cameraState === 'denied' && (
            <div className="flex items-start gap-2.5 text-xs text-amber-300 bg-amber-950/20 p-3 rounded-lg border border-amber-800/40">
              <CameraOff className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />
              <div>
                <p className="font-semibold">Camera Access Denied / Blocked</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Camera permission was denied or is blocked by the browser sandbox. Please check your browser address bar permissions or open the app in a new tab. In the meantime, you can test motion reactivity using the <strong>Simulate Wave Gesture</strong> trigger below!
                </p>
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div className="flex items-start gap-2 text-[11px] text-gray-400 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-950/40">
            <Info className="w-3.5 h-3.5 mt-0.5 text-emerald-400 shrink-0" />
            <p>
              <strong>Privacy Assurance:</strong> Digital analysis runs completely offline and locally in your browser. Raw frame pixels are transformed into standard math delta grids of 32x24 blocks. No imagery ever departs this machine.
            </p>
          </div>
        </div>
      ) : (
        <div id="camera-disabled-placeholder" className="bg-gray-950/50 rounded-xl p-4 text-center border border-gray-800">
          <CameraOff className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-xs text-gray-300 font-medium">Camera Wake Sensing is Offline</p>
          <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto">
            Enable motion-sensing and grant camera access. If you don't have a camera or want to test without enabling video, use our interactive mockup below.
          </p>
        </div>
      )}

      {/* Mock Interaction Simulator */}
      <div className="mt-4 pt-4 border-t border-gray-800/60 flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">Quick Demonstration & Testing:</span>
        <button
          id="simulate-motion-btn"
          onClick={triggerSimulatedMotion}
          disabled={isSimulatedWaveActive}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            isSimulatedWaveActive
              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 cursor-pointer active:scale-95'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isSimulatedWaveActive ? 'Waving Hand...' : 'Simulate Wave Gesture'}
        </button>
      </div>
    </div>
  );
}
