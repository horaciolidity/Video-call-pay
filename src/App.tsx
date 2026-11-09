import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { GondolaMarketplace } from './components/GondolaMarketplace';
import { ProfileModal } from './components/ProfileModal';
import { VideoCallRoom } from './components/VideoCallRoom';
import { IncomingCallModal } from './components/IncomingCallModal';
import { WalletModal } from './components/WalletModal';
import { UserDashboard } from './components/UserDashboard';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { AuthModal } from './components/AuthModal';
import { CallRequest, EnrichedProvider } from './types';
import { api } from './services/api';
import { wsClient } from './services/websocket';

function MainApp() {
  const { user, refreshUser } = useAuth();

  // Navigation View: 'marketplace' | 'dashboard' | 'superadmin'
  const [currentView, setCurrentView] = useState<'marketplace' | 'dashboard' | 'superadmin'>('marketplace');

  // Modals & Panels
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Active Videocall State
  const [activeCall, setActiveCall] = useState<CallRequest | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallRequest | null>(null);

  // Search Filter in Navbar
  const [searchTerm, setSearchTerm] = useState('');

  // Check for existing active call on mount or session change
  useEffect(() => {
    if (user) {
      api.getActiveCall().then((res) => {
        if (res.activeCall) {
          if (res.activeCall.status === 'in_progress' || res.activeCall.status === 'accepted') {
            setActiveCall(res.activeCall);
          } else if (res.activeCall.status === 'pending' && res.activeCall.providerId === user.id) {
            setIncomingCall(res.activeCall);
          }
        }
      }).catch(() => {});
    }
  }, [user]);

  // Listen for WebSocket real-time incoming call requests and acceptances
  useEffect(() => {
    const offIncoming = wsClient.on('incoming_call_request', (data) => {
      console.log('[App] Incoming call event received:', data);
      if (data.call && user && data.call.providerId === user.id) {
        setIncomingCall(data.call);
      }
    });

    const offAccepted = wsClient.on('call_accepted', (data) => {
      console.log('[App] Call accepted event received:', data);
      if (activeCall && activeCall.callId === data.callId) {
        setActiveCall((prev) => (prev ? { ...prev, status: 'in_progress' } : null));
      } else {
        // Fetch active call to join room
        api.getActiveCall().then((res) => {
          if (res.activeCall) setActiveCall(res.activeCall);
        });
      }
    });

    return () => {
      offIncoming();
      offAccepted();
    };
  }, [user, activeCall]);

  // Client requests a call
  const handleRequestCall = async (providerId: string, durationMinutes: number) => {
    if (!user) {
      setAuthTab('login');
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await api.requestCall(providerId, durationMinutes);
      setSelectedProviderId(null);
      await refreshUser();

      if (res.autoAccepted || res.call.status === 'accepted') {
        setActiveCall(res.call);
      } else {
        // Pending approval from provider
        setActiveCall(res.call);
      }
    } catch (err: any) {
      alert(err.message || 'Error al solicitar videollamada');
    }
  };

  // Direct Call from card
  const handleDirectCall = (provider: EnrichedProvider) => {
    setSelectedProviderId(provider.id);
  };

  // Provider responds to incoming call
  const handleAcceptIncomingCall = async () => {
    if (!incomingCall) return;
    try {
      await api.respondCall(incomingCall.id, 'accept');
      setActiveCall({ ...incomingCall, status: 'in_progress' });
      setIncomingCall(null);
      await refreshUser();
    } catch (err: any) {
      alert(err.message || 'Error al aceptar llamada');
    }
  };

  const handleRejectIncomingCall = async () => {
    if (!incomingCall) return;
    try {
      await api.respondCall(incomingCall.id, 'reject');
      setIncomingCall(null);
    } catch (err: any) {
      alert(err.message || 'Error al rechazar llamada');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Primary Responsive Navigation */}
      <Navbar
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenAuth={(tab = 'login') => {
          setAuthTab(tab);
          setIsAuthOpen(true);
        }}
        onNavigate={(view) => setCurrentView(view)}
        currentView={currentView}
        activeCallId={activeCall?.callId}
        onReturnToCall={() => {}}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Main Views Container */}
      <main className="flex-1 w-full">
        {currentView === 'marketplace' && (
          <GondolaMarketplace
            onSelectProvider={(p) => setSelectedProviderId(p.id)}
            onDirectCall={handleDirectCall}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        )}

        {currentView === 'dashboard' && (
          <UserDashboard
            onOpenWallet={() => setIsWalletOpen(true)}
            onNavigateHome={() => setCurrentView('marketplace')}
          />
        )}

        {currentView === 'superadmin' && (
          <SuperAdminPanel
            onNavigateHome={() => setCurrentView('marketplace')}
          />
        )}
      </main>

      {/* Mobile Ergonomic Bottom Navigation Bar */}
      <BottomNav
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenWallet={() => setIsWalletOpen(true)}
        activeCallId={activeCall?.callId}
        onReturnToCall={() => {}}
      />

      {/* Modal: Public Profile & Escaparate of Provider */}
      {selectedProviderId && (
        <ProfileModal
          providerId={selectedProviderId}
          onClose={() => setSelectedProviderId(null)}
          onRequestCall={handleRequestCall}
          onOpenWallet={() => setIsWalletOpen(true)}
          onOpenAuth={() => {
            setAuthTab('login');
            setIsAuthOpen(true);
          }}
        />
      )}

      {/* Modal: Incoming Call Ringing alert for provider */}
      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={handleAcceptIncomingCall}
          onReject={handleRejectIncomingCall}
        />
      )}

      {/* Fullscreen Video Call Room */}
      {activeCall && (
        <VideoCallRoom
          call={activeCall}
          onCallEnded={() => {
            setActiveCall(null);
            refreshUser();
          }}
        />
      )}

      {/* Modal: Wallet & Balance Management */}
      {isWalletOpen && (
        <WalletModal onClose={() => setIsWalletOpen(false)} />
      )}

      {/* Modal: Authentication (Login / Register / Recover) */}
      {isAuthOpen && (
        <AuthModal
          initialTab={authTab}
          onClose={() => setIsAuthOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
