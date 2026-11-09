import React, { useState, useEffect, useRef } from 'react';
import { CallRequest } from '../types';
import { api } from '../services/api';
import { wsClient } from '../services/websocket';
import { useAuth } from '../context/AuthContext';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  RefreshCw,
  Clock,
  Shield,
  AlertTriangle,
  Sparkles,
  Volume2,
  Wifi,
  WifiOff,
  CheckCircle2
} from 'lucide-react';

interface VideoCallRoomProps {
  call: CallRequest;
  onCallEnded: () => void;
}

export const VideoCallRoom: React.FC<VideoCallRoomProps> = ({ call, onCallEnded }) => {
  const { user, refreshUser } = useAuth();
  
  // Media streams & devices
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Call states
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
  
  // Timer states
  const totalSeconds = call.durationMinutes * 60;
  const [elapsedSeconds, setElapsedSeconds] = useState(call.actualSecondsUsed || 0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [callSummary, setCallSummary] = useState<{
    effectiveSeconds: number;
    clientCharge: number;
    providerEarning: number;
  } | null>(null);

  const isProvider = user?.id === call.providerId;
  const isClient = user?.id === call.clientId;
  const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);

  // 1. Initialize Local Media Stream
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Start call record on server
        api.startCall(call.id).catch(() => {});
        setupPeerConnection(stream);
      } catch (err: any) {
        console.warn('[VideoCall] Could not acquire camera/mic, using procedural simulation:', err);
        // Procedural simulation if camera blocked or denied
        createProceduralLocalStream();
        api.startCall(call.id).catch(() => {});
      }
    }

    initMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      wsClient.leaveRoom(call.callId);
    };
  }, [facingMode]);

  // Procedural canvas fallback in case device has no camera or permission denied in iframe
  const createProceduralLocalStream = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        let angle = 0;
        const anim = () => {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 640, 480);
          ctx.fillStyle = '#6366f1';
          ctx.beginPath();
          ctx.arc(320 + Math.sin(angle) * 80, 240 + Math.cos(angle) * 40, 50, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(user?.alias || user?.name || 'Tu Cámara', 320, 240);
          angle += 0.05;
          if (localStreamRef.current) {
            requestAnimationFrame(anim);
          }
        };
        anim();
        const canvasStream = (canvas as any).captureStream(30);
        localStreamRef.current = canvasStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = canvasStream;
        }
      }
    } catch (e) {
      console.warn('[VideoCall] Canvas fallback failed:', e);
    }
  };

  // 2. Setup WebRTC PeerConnection & WebSocket Signaling
  const setupPeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });
    peerConnectionRef.current = pc;

    // Add local tracks to WebRTC
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Handle remote tracks
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Send ICE candidates via signaling server
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsClient.send({
          type: 'webrtc_ice_candidate',
          roomId: call.callId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected');
      } else if (pc.connectionState === 'connecting' || pc.connectionState === 'disconnected') {
        setConnectionStatus('reconnecting');
      } else if (pc.connectionState === 'failed') {
        setConnectionStatus('disconnected');
      }
    };

    // Join room
    wsClient.joinRoom(call.callId, user?.id);

    // WebSocket Listeners
    const offPeer = wsClient.on('peer_joined', async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        wsClient.send({
          type: 'webrtc_offer',
          roomId: call.callId,
          offer,
        });
      } catch (err) {
        console.error('[WebRTC] Error creating offer:', err);
      }
    });

    const offOffer = wsClient.on('webrtc_offer', async (data) => {
      try {
        if (data.roomId === call.callId && data.offer) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          wsClient.send({
            type: 'webrtc_answer',
            roomId: call.callId,
            answer,
          });
        }
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    });

    const offAnswer = wsClient.on('webrtc_answer', async (data) => {
      try {
        if (data.roomId === call.callId && data.answer) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      } catch (err) {
        console.error('[WebRTC] Error setting answer:', err);
      }
    });

    const offCandidate = wsClient.on('webrtc_ice_candidate', async (data) => {
      try {
        if (data.roomId === call.callId && data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error('[WebRTC] Error adding ICE candidate:', err);
      }
    });

    const offFinish = wsClient.on('call_finished', (data) => {
      if (data.callId === call.callId) {
        setCallSummary({
          effectiveSeconds: data.actualSecondsUsed,
          clientCharge: data.totalCharge,
          providerEarning: data.providerEarning,
        });
        refreshUser();
      }
    });

    return () => {
      offPeer();
      offOffer();
      offAnswer();
      offCandidate();
      offFinish();
    };
  };

  // 3. Billing & Timer Heartbeat Engine (Stops when disconnected)
  useEffect(() => {
    if (callSummary) return;

    const interval = setInterval(async () => {
      // Only count and advance if connection is active
      if (connectionStatus === 'connected') {
        setElapsedSeconds(prev => {
          const next = prev + 1;
          // Auto end if max duration reached
          if (next >= totalSeconds) {
            handleEndCall();
          }
          return next;
        });
      }
    }, 1000);

    // Heartbeat every 5 seconds to sync server seconds
    const heartbeatInterval = setInterval(() => {
      if (connectionStatus === 'connected') {
        api.callHeartbeat(call.id, 5).catch(() => {});
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(heartbeatInterval);
    };
  }, [connectionStatus, totalSeconds, callSummary]);

  // 4. Media Controls
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        wsClient.send({
          type: 'media_state_change',
          roomId: call.callId,
          state: { video: videoTrack.enabled, audio: isAudioEnabled },
        });
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        wsClient.send({
          type: 'media_state_change',
          roomId: call.callId,
          state: { video: isVideoEnabled, audio: audioTrack.enabled },
        });
      }
    }
  };

  const flipCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleEndCall = async () => {
    if (isFinishing || callSummary) return;
    setIsFinishing(true);

    try {
      const res = await api.endCall(call.id);
      setCallSummary({
        effectiveSeconds: res.effectiveSeconds,
        clientCharge: res.clientCharge,
        providerEarning: res.providerEarning,
      });
      await refreshUser();
    } catch (err: any) {
      console.error('[VideoCall] Error ending call:', err);
      // Fallback close
      setCallSummary({
        effectiveSeconds: elapsedSeconds,
        clientCharge: call.totalAmount,
        providerEarning: call.providerAmount,
      });
    } finally {
      setIsFinishing(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min((elapsedSeconds / totalSeconds) * 100, 100);
  const partnerName = isProvider ? call.clientName : call.providerName;
  const partnerAvatar = isProvider ? call.clientAvatar : call.providerAvatar;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden select-none">
      
      {/* Top Header Bar */}
      <div className="absolute top-0 inset-x-0 z-30 p-4 sm:p-6 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent flex items-center justify-between pointer-events-none">
        
        {/* Partner Info */}
        <div className="flex items-center gap-3 pointer-events-auto bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 shadow-xl">
          <img
            src={partnerAvatar}
            alt={partnerName}
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/50"
          />
          <div>
            <div className="font-extrabold text-sm text-white flex items-center gap-1.5 leading-tight">
              <span>{partnerName}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Sala Encriptada #{call.callId.slice(-6)}</span>
            </div>
          </div>
        </div>

        {/* Live Countdown & Consumption Indicator */}
        <div className="pointer-events-auto flex items-center gap-3">
          
          {/* Connection Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300 backdrop-blur-md">
            {connectionStatus === 'connected' ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">Excelente</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-amber-300 font-semibold">Reconectando</span>
              </>
            )}
          </div>

          {/* Time Remaining Pill */}
          <div
            className={`px-4 py-2 rounded-2xl border backdrop-blur-md shadow-xl flex items-center gap-2.5 transition-colors ${
              remainingSeconds <= 60
                ? 'bg-rose-950/90 border-rose-500 text-rose-200 animate-pulse'
                : 'bg-slate-900/90 border-slate-800 text-white'
            }`}
          >
            <Clock className={`w-4 h-4 ${remainingSeconds <= 60 ? 'text-rose-400' : 'text-indigo-400'}`} />
            <div className="text-right">
              <div className="text-xs font-mono font-extrabold leading-none">
                {formatTimer(remainingSeconds)}
              </div>
              <div className="text-[9px] text-slate-400 font-medium">Restante</div>
            </div>
          </div>
        </div>
      </div>

      {/* 1-Minute Warning Banner */}
      {remainingSeconds <= 60 && remainingSeconds > 0 && (
        <div className="absolute top-20 inset-x-0 z-30 flex justify-center px-4 animate-in fade-in duration-300">
          <div className="bg-rose-600/90 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border border-rose-400">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            <span>¡Atención! Queda menos de 1 minuto de videollamada contratada.</span>
          </div>
        </div>
      )}

      {/* Main Video Viewport (Remote Peer Video / Procedural Partner View) */}
      <div className="relative flex-1 w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
        
        {/* Remote Video Stream or Avatar fallback */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Ambient Partner Simulation Display (In case the peer hasn't sent video or solo test) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/80 pointer-events-none">
          <div className="relative mb-4">
            <img
              src={partnerAvatar}
              alt={partnerName}
              className="w-32 h-32 sm:w-44 sm:h-44 rounded-full object-cover ring-8 ring-indigo-500/20 border-4 border-indigo-500/40 shadow-2xl animate-pulse"
            />
            <span className="absolute bottom-2 right-4 w-6 h-6 rounded-full bg-emerald-500 ring-4 ring-slate-950 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-white" />
            </span>
          </div>
          <h3 className="text-xl font-bold text-white drop-shadow-md">{partnerName}</h3>
          <p className="text-xs text-indigo-300 flex items-center gap-1.5 mt-1 font-medium drop-shadow">
            <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Videollamada privada en vivo</span>
          </p>
        </div>

        {/* Draggable / Floating Local Video Picture-in-Picture */}
        <div className="absolute bottom-24 right-4 sm:bottom-28 sm:right-8 z-20 w-28 sm:w-48 aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700/80 shadow-2xl transition-all">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-400 text-xs">
              <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
              <span>Cámara Apagada</span>
            </div>
          )}
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-slate-950/70 text-[9px] font-bold text-slate-300">
            Tú
          </div>
        </div>

        {/* Linear Duration Progress Bar */}
        <div className="absolute bottom-20 inset-x-0 h-1 bg-slate-800/80">
          <div
            className={`h-full transition-all duration-1000 ${
              remainingSeconds <= 60 ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Floating Bottom Control Bar */}
      <div className="absolute bottom-0 inset-x-0 z-30 p-4 sm:p-6 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-center justify-center gap-3 sm:gap-4">
        
        {/* Mic Toggle */}
        <button
          onClick={toggleAudio}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all shadow-lg active:scale-95 ${
            isAudioEnabled
              ? 'bg-slate-900/90 border-slate-700 text-white hover:bg-slate-800'
              : 'bg-rose-600 border-rose-500 text-white hover:bg-rose-500'
          }`}
          title={isAudioEnabled ? 'Silenciar micrófono' : 'Activar micrófono'}
        >
          {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={toggleVideo}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all shadow-lg active:scale-95 ${
            isVideoEnabled
              ? 'bg-slate-900/90 border-slate-700 text-white hover:bg-slate-800'
              : 'bg-rose-600 border-rose-500 text-white hover:bg-rose-500'
          }`}
          title={isVideoEnabled ? 'Apagar cámara' : 'Encender cámara'}
        >
          {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Flip Camera (Front / Rear on mobile) */}
        <button
          onClick={flipCamera}
          className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-700 text-white hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          title="Cambiar de cámara (frontal / trasera)"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="hidden sm:block p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-700 text-white hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          title="Pantalla completa"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>

        {/* Hang Up & End Call */}
        <button
          onClick={handleEndCall}
          disabled={isFinishing}
          className="px-6 py-3.5 sm:py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 flex items-center gap-2 transition-all active:scale-95"
          title="Finalizar llamada"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="hidden sm:inline">Finalizar</span>
        </button>
      </div>

      {/* Post-Call Summary Modal */}
      {callSummary && (
        <div className="fixed inset-0 z-60 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl space-y-6 text-center">
            
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Videollamada Finalizada
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                La sesión ha concluido y el consumo fue liquidado de forma transparente.
              </p>
            </div>

            {/* Billing Breakdown Table */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2.5 text-left">
              <div className="flex justify-between text-slate-400">
                <span>Participante:</span>
                <span className="font-semibold text-white">{partnerName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tiempo efectivo conectado:</span>
                <span className="font-semibold text-white">
                  {Math.round(callSummary.effectiveSeconds / 60)} min ({callSummary.effectiveSeconds} segundos)
                </span>
              </div>

              {isClient && (
                <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800 text-sm">
                  <span>Importe total debitado:</span>
                  <span className="font-bold text-emerald-400">${callSummary.clientCharge.toFixed(2)} USD</span>
                </div>
              )}

              {isProvider && (
                <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800 text-sm">
                  <span>Ganancia neta acreditada:</span>
                  <span className="font-bold text-emerald-400">${callSummary.providerEarning.toFixed(2)} USD</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400 pt-1 text-[11px]">
                <span>Tu nuevo saldo disponible:</span>
                <span className="font-bold text-indigo-400">${user?.walletBalance.toFixed(2)} USD</span>
              </div>
            </div>

            <button
              onClick={onCallEnded}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-indigo-600/30"
            >
              Volver a la Góndola
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
