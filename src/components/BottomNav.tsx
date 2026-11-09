import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Layers, User, Wallet, ShieldCheck, Video } from 'lucide-react';

interface BottomNavProps {
  currentView: 'marketplace' | 'dashboard' | 'superadmin';
  onNavigate: (view: 'marketplace' | 'dashboard' | 'superadmin') => void;
  onOpenWallet: () => void;
  activeCallId?: string | null;
  onReturnToCall?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenWallet,
  activeCallId,
  onReturnToCall,
}) => {
  const { user } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1 safe-area-pb">
      <div className="flex items-center justify-around h-14">
        
        {/* Marketplace */}
        <button
          onClick={() => onNavigate('marketplace')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentView === 'marketplace' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Góndola</span>
        </button>

        {/* Active Call Floating Button if in call */}
        {activeCallId ? (
          <button
            onClick={onReturnToCall}
            className="flex flex-col items-center justify-center -mt-5 bg-emerald-600 text-white rounded-full w-12 h-12 shadow-lg shadow-emerald-500/40 animate-pulse"
          >
            <Video className="w-6 h-6" />
          </button>
        ) : (
          /* Billetera */
          <button
            onClick={onOpenWallet}
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <Wallet className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] mt-0.5">${user ? user.walletBalance.toFixed(0) : '0'} USD</span>
          </button>
        )}

        {/* Dashboard / Escaparate */}
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentView === 'dashboard' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Mi Perfil</span>
        </button>

        {/* SuperAdmin if permitted */}
        {(user?.role === 'superadmin' || user?.role === 'administrador') && (
          <button
            onClick={() => onNavigate('superadmin')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              currentView === 'superadmin' ? 'text-rose-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-rose-500" />
            <span className="text-[10px] mt-0.5">Admin</span>
          </button>
        )}
      </div>
    </nav>
  );
};
