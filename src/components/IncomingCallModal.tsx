import React from 'react';
import { CallRequest } from '../types';
import { Video, PhoneCall, PhoneOff, Clock, DollarSign } from 'lucide-react';

interface IncomingCallModalProps {
  call: CallRequest;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  call,
  onAccept,
  onReject,
}) => {
  return (
    <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-indigo-500/50 shadow-2xl p-6 text-center space-y-6 overflow-hidden">
        
        {/* Pulsing ring aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative">
          <div className="relative inline-block">
            <img
              src={call.clientAvatar}
              alt={call.clientName}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500 border-4 border-slate-950 shadow-2xl mx-auto"
            />
            <span className="absolute bottom-0 right-1 flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 border-2 border-slate-900 items-center justify-center text-white">
                <Video className="w-3 h-3" />
              </span>
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-white mt-4">{call.clientName}</h3>
          <p className="text-xs text-indigo-300 font-medium">Te está llamando por videollamada...</p>
        </div>

        {/* Call Terms Pill */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-300">
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              Duración:
            </span>
            <span className="font-bold text-white">{call.durationMinutes} minutos</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="flex items-center gap-1 text-slate-400">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Tus ganancias netas:
            </span>
            <span className="font-extrabold text-emerald-400">${call.providerAmount.toFixed(2)} USD</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onReject}
            className="py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <PhoneOff className="w-4 h-4 text-rose-400" />
            <span>Rechazar</span>
          </button>

          <button
            onClick={onAccept}
            className="py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-600/30 active:scale-95 animate-pulse"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Aceptar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
