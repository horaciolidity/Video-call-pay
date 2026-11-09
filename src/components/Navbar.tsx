import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import {
  Video,
  Wallet,
  Bell,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Sparkles,
  Plus,
  CheckCircle2,
  Clock,
  Menu,
  X,
  Layers,
  Settings,
  AlertCircle
} from 'lucide-react';

interface NavbarProps {
  onOpenWallet: () => void;
  onOpenAuth: (initialTab?: 'login' | 'register') => void;
  onNavigate: (view: 'marketplace' | 'dashboard' | 'superadmin') => void;
  currentView: 'marketplace' | 'dashboard' | 'superadmin';
  activeCallId?: string | null;
  onReturnToCall?: () => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenWallet,
  onOpenAuth,
  onNavigate,
  currentView,
  activeCallId,
  onReturnToCall,
  searchTerm,
  setSearchTerm,
}) => {
  const { user, isAuthenticated, logout, quickSwitchAccount } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications);
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const handleQuickSwitch = async (id: string) => {
    setShowSwitchMenu(false);
    await quickSwitchAccount(id);
    setShowUserMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('marketplace')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 text-white shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
                <Video className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
                  Góndola<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400">Live</span>
                </span>
                <span className="hidden sm:block text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                  Marketplace & Videollamadas
                </span>
              </div>
            </button>

            {/* View Selector Tabs */}
            <nav className="hidden md:flex items-center ml-6 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80">
              <button
                onClick={() => onNavigate('marketplace')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  currentView === 'marketplace'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Góndola de Perfiles
              </button>

              {user && (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    currentView === 'dashboard'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Mi Escaparate & Panel
                </button>
              )}

              {(user?.role === 'superadmin' || user?.role === 'administrador') && (
                <button
                  onClick={() => onNavigate('superadmin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    currentView === 'superadmin'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  SuperAdmin
                </button>
              )}
            </nav>
          </div>

          {/* Quick Active Call Floating Pill */}
          {activeCallId && (
            <button
              onClick={onReturnToCall}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-medium animate-pulse hover:bg-emerald-500/30 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Llamada en Curso (Volver)
            </button>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Account Switcher (For seamless testing between Client, Providers & SuperAdmin) */}
            <div className="relative">
              <button
                onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/50 text-[11px] font-medium text-indigo-300 hover:bg-indigo-900/40 transition-colors"
                title="Cambiar de usuario para probar ambos lados"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Simulador de Roles</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {showSwitchMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 text-xs">
                  <div className="px-3 py-1.5 font-semibold text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800/80">
                    Cambio Rápido de Cuenta Demo
                  </div>
                  <button
                    onClick={() => handleQuickSwitch('usr_client_demo')}
                    className="w-full px-3 py-2 text-left hover:bg-slate-800/70 flex items-center gap-2 text-slate-200"
                  >
                    <span className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">C</span>
                    <div>
                      <div className="font-semibold flex items-center gap-1">Martín Almada <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-300">Cliente</span></div>
                      <div className="text-[11px] text-slate-400">Saldo listo para llamar ($125 USD)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleQuickSwitch('usr_prov_1')}
                    className="w-full px-3 py-2 text-left hover:bg-slate-800/70 flex items-center gap-2 text-slate-200"
                  >
                    <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">S</span>
                    <div>
                      <div className="font-semibold flex items-center gap-1">Sofía Valenzuela <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-300">Prestadora</span></div>
                      <div className="text-[11px] text-slate-400">Fitness & Nutrición ($2.50/m)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleQuickSwitch('usr_prov_2')}
                    className="w-full px-3 py-2 text-left hover:bg-slate-800/70 flex items-center gap-2 text-slate-200"
                  >
                    <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">L</span>
                    <div>
                      <div className="font-semibold flex items-center gap-1">Lucas Moretti <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300">Prestador</span></div>
                      <div className="text-[11px] text-slate-400">Consultoría & Startups ($4.00/m)</div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-800"></div>

                  <button
                    onClick={() => handleQuickSwitch('usr_superadmin')}
                    className="w-full px-3 py-2 text-left hover:bg-rose-950/40 flex items-center gap-2 text-rose-300"
                  >
                    <span className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">👑</span>
                    <div>
                      <div className="font-semibold flex items-center gap-1">SuperAdmin Central <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-900/80 text-rose-200">Admin</span></div>
                      <div className="text-[11px] text-slate-400">Comisiones, retiros y censura</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Wallet Balance Display & Recharge Button */}
            {user && (
              <div className="flex items-center bg-slate-900/90 rounded-xl border border-slate-800 p-1 shadow-inner">
                <button
                  onClick={onOpenWallet}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
                  title="Abrir Billetera"
                >
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>${user.walletBalance.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400">USD</span>
                </button>
                <button
                  onClick={onOpenWallet}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
                  title="Recargar saldo"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Notification Bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
                  title="Notificaciones"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popover */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                      <div className="font-semibold text-sm text-white flex items-center gap-2">
                        <span>Notificaciones</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            {unreadCount} nuevas
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          Marcar leídas
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          No tienes notificaciones pendientes.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3.5 transition-colors ${
                              n.read ? 'bg-transparent text-slate-400' : 'bg-slate-800/30 text-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-xs text-white">{n.title}</span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                                <Clock className="w-3 h-3" />
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs mt-1 leading-relaxed text-slate-300">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Dropdown or Auth Button */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/70 transition-colors"
                >
                  <img
                    src={user.avatar}
                    alt={user.alias || user.name}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-indigo-500/40"
                  />
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                      {user.alias || user.name}
                      {user.isVerifiedBadge && (
                        <CheckCircle2 className="w-3 h-3 text-sky-400 inline" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">{user.role}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-slate-800/80">
                      <div className="font-semibold text-white">{user.name}</div>
                      <div className="text-slate-400 text-[11px] truncate">{user.email}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`inline-block w-2 h-2 rounded-full ${user.status === 'disponible' ? 'bg-emerald-500' : user.status === 'ocupado' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                        <span className="text-[11px] text-slate-300 capitalize">{user.status}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('dashboard');
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-800/70 flex items-center gap-2.5 text-slate-200"
                    >
                      <UserIcon className="w-4 h-4 text-indigo-400" />
                      <span>Mi Escaparate & Perfil</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenWallet();
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-800/70 flex items-center gap-2.5 text-slate-200"
                    >
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      <span>Billetera & Retiros</span>
                    </button>

                    {(user.role === 'superadmin' || user.role === 'administrador') && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('superadmin');
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-rose-950/40 flex items-center gap-2.5 text-rose-300"
                      >
                        <ShieldCheck className="w-4 h-4 text-rose-400" />
                        <span>Panel SuperAdmin</span>
                      </button>
                    )}

                    <div className="my-1 border-t border-slate-800"></div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-800/70 flex items-center gap-2.5 text-slate-400 hover:text-white"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Ingresar
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
                >
                  Crear Cuenta
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-800 space-y-2">
            <button
              onClick={() => {
                onNavigate('marketplace');
                setMobileMenuOpen(false);
              }}
              className={`w-full px-3 py-2 rounded-xl text-left text-sm font-semibold flex items-center gap-2 ${
                currentView === 'marketplace' ? 'bg-indigo-600 text-white' : 'text-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              Góndola de Perfiles
            </button>

            {user && (
              <button
                onClick={() => {
                  onNavigate('dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-left text-sm font-semibold flex items-center gap-2 ${
                  currentView === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-300'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                Mi Escaparate & Panel
              </button>
            )}

            {(user?.role === 'superadmin' || user?.role === 'administrador') && (
              <button
                onClick={() => {
                  onNavigate('superadmin');
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-left text-sm font-semibold flex items-center gap-2 ${
                  currentView === 'superadmin' ? 'bg-rose-600 text-white' : 'text-rose-400'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Panel SuperAdmin
              </button>
            )}

            {/* Mobile quick switcher */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
                Cambio de Rol Rápido
              </div>
              <div className="grid grid-cols-2 gap-1.5 px-1">
                <button
                  onClick={() => handleQuickSwitch('usr_client_demo')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-xs text-blue-300 font-medium"
                >
                  Cliente Demo
                </button>
                <button
                  onClick={() => handleQuickSwitch('usr_prov_1')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-xs text-emerald-300 font-medium"
                >
                  Prestadora Sofi
                </button>
                <button
                  onClick={() => handleQuickSwitch('usr_prov_2')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-xs text-amber-300 font-medium"
                >
                  Prestador Lucas
                </button>
                <button
                  onClick={() => handleQuickSwitch('usr_superadmin')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-left text-xs text-rose-300 font-medium"
                >
                  SuperAdmin
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
