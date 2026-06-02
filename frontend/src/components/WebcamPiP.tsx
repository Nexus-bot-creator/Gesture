import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { Camera, CameraOff, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface WebcamPiPProps {
  onCursorMove: (x: number, y: number) => void;
  onPinch: (isPinching: boolean) => void;
}

// Hand connections index map
const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [9, 10], [10, 11], [11, 12],
  [5, 9], [9, 13], [13, 17],
  [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20]
];

export const WebcamPiP: React.FC<WebcamPiPProps> = ({ onCursorMove, onPinch }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);

  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'loading' | 'active' | 'error'>('idle');
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Initialize MediaPipe HandLandmarker model
  const initHandTracker = useCallback(async () => {
    if (landmarkerRef.current) return;
    
    setIsLoadingModel(true);
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
      );

      const instance = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
      });

      landmarkerRef.current = instance;
      setIsLoadingModel(false);
    } catch (err) {
      console.error('Failed to load MediaPipe HandLandmarker:', err);
      setIsLoadingModel(false);
      setCameraStatus('error');
    }
  }, []);

  // Connect to FastAPI tracking WebSocket
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) return;

    setWsStatus('connecting');
    const ws = new WebSocket('ws://127.0.0.1:8000/ws/tracking');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected to FastAPI');
      setWsStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.x !== undefined && payload.y !== undefined) {
          // Map normalized coords [0, 1] to screen pixel values
          const px = payload.x * window.innerWidth;
          const py = payload.y * window.innerHeight;
          onCursorMove(px, py);
          onPinch(payload.is_pinching);
        }
      } catch (err) {
        console.error('Error parsing WebSocket frame:', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      setWsStatus('disconnected');
    };

    ws.onerror = (err) => {
      console.error('WebSocket connection error:', err);
      setWsStatus('disconnected');
    };
  }, [onCursorMove, onPinch]);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsStatus('disconnected');
  }, []);

  // Main frame analysis tick
  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused || video.ended) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const ctx = canvas.getContext('2d');
    const landmarker = landmarkerRef.current;

    if (ctx && landmarker && video.readyState >= 2) {
      const width = video.videoWidth;
      const height = video.videoHeight;
      canvas.width = width;
      canvas.height = height;

      // Clear overlay canvas
      ctx.clearRect(0, 0, width, height);

      // Perform local hand extraction
      const result = landmarker.detectForVideo(video, performance.now());

      if (result.landmarks && result.landmarks.length > 0) {
        const rawLandmarks = result.landmarks[0];

        // 1. Draw joints skeleton locally (mirrored horizontally)
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#a855f7'; // glowing purple lines
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.6)';

        CONNECTIONS.forEach(([startIdx, endIdx]) => {
          const start = rawLandmarks[startIdx];
          const end = rawLandmarks[endIdx];
          if (start && end) {
            ctx.beginPath();
            ctx.moveTo((1 - start.x) * width, start.y * height);
            ctx.lineTo((1 - end.x) * width, end.y * height);
            ctx.stroke();
          }
        });

        ctx.fillStyle = '#06b6d4'; // cyan knuckles
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
        rawLandmarks.forEach((point) => {
          ctx.beginPath();
          ctx.arc((1 - point.x) * width, point.y * height, 6, 0, 2 * Math.PI);
          ctx.fill();
        });

        // Reset shadow blurring
        ctx.shadowBlur = 0;

        // 2. Stream base keypoints over WebSocket to the FastAPI backend for smoothing & triggers
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ landmarks: rawLandmarks }));
        }
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    disconnectWebSocket();
    setCameraStatus('idle');
  }, [stream, disconnectWebSocket]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setCameraStatus('loading');
    await initHandTracker();
    connectWebSocket();

    const constraints = {
      video: {
        width: { ideal: 320 },
        height: { ideal: 240 },
        frameRate: { ideal: 30 }
      },
      audio: false
    };

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      const video = videoRef.current;
      if (video) {
        video.srcObject = mediaStream;
        video.play();
        setCameraStatus('active');
      }
    } catch (err) {
      console.error('Camera startup failed:', err);
      setCameraStatus('error');
      disconnectWebSocket();
    }
  }, [initHandTracker, connectWebSocket, disconnectWebSocket]);

  // Start tick animation loop when camera active
  useEffect(() => {
    if (cameraStatus === 'active') {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [cameraStatus, tick]);

  // Clean up camera stream when stream changes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Clean up WebSocket on component unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="webcam-container fixed bottom-6 right-6 z-40 flex flex-col items-end space-y-3">
      {/* Mini PiP Screen */}
      <div className="w-56 h-40 rounded-2xl overflow-hidden border border-white/10 bg-slate-950/95 shadow-2xl relative group">
        <video
          ref={videoRef}
          className="w-full h-full object-cover scale-x-[-1]"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Loading overlay */}
        {cameraStatus === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20">
            <RefreshCw className="w-8 h-8 text-cyber-accent animate-spin mb-2" />
            <span className="text-[10px] font-mono text-slate-400">Loading tracking model...</span>
          </div>
        )}

        {/* Inactive overlay */}
        {cameraStatus === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20">
            <CameraOff className="w-7 h-7 text-slate-500 mb-2" />
            <span className="text-[10px] font-semibold text-slate-400">Camera Off</span>
          </div>
        )}

        {/* Connection indicators */}
        {cameraStatus === 'active' && (
          <div className="absolute top-2 left-2 z-20 flex items-center space-x-1.5 bg-slate-900/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[8px] font-mono border border-white/5">
            {wsStatus === 'connected' ? (
              <>
                <Wifi className="w-3 h-3 text-cyber-emerald" />
                <span className="text-cyber-emerald font-bold">FastAPI Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-rose-500 animate-pulse" />
                <span className="text-rose-500 font-bold">FastAPI Disconnected</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Action Control Button */}
      <div className="flex items-center space-x-2">
        {cameraStatus === 'active' ? (
          <button
            onClick={stopCamera}
            className="flex items-center space-x-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <CameraOff className="w-4 h-4" />
            <span>Turn Off Tracking</span>
          </button>
        ) : (
          <button
            onClick={startCamera}
            disabled={cameraStatus === 'loading' || isLoadingModel}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-cyber-accent to-cyber-purple hover:scale-[1.02] text-cyber-black px-4 py-2 rounded-xl text-xs font-black transition-all shadow-neon-cyan"
          >
            <Camera className="w-4 h-4 text-cyber-black" />
            <span>Turn On Tracking</span>
          </button>
        )}
      </div>
    </div>
  );
};
export default WebcamPiP;
