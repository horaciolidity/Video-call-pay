import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, PlatformSettings, WithdrawalRequest, Report, AuditLog } from '../types';
import {
  ShieldCheck,
  Users,
  DollarSign,
  TrendingUp,
  Video,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Lock,
  Unlock,
  BadgeCheck,
  Sparkles,
  RefreshCw,
  FileText,
  Save,
  Check,
  X,
  Clock
} from 'lucide-react';

interface SuperAdminPanelProps {
  onNavigateHome: () => void;
}

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ onNavigateHome }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'metrics' | 'settings' | 'users' | 'withdrawals' | 'moderation' | 'audit'>('metrics');

  // Metrics
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  // Settings
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  // Users Management
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Withdrawals Queue
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);

  // Moderation & Reports
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    loadMetrics();
    loadSettings();
    loadUsers();
    loadWithdrawals();
    loadReports();
    loadAuditLogs();
  };

  const loadMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const res = await api.getAdminMetrics();
      setMetrics(res.metrics);
    } catch {
      // ignore
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await api.getAdminSettings();
      setSettings(res.settings);
    } catch {
      // ignore
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await api.getAdminUsers({ search: userSearch, role: userRoleFilter });
      setUsersList(res.users);
    } catch {
      // ignore
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadWithdrawals = async () => {
    setIsLoadingWithdrawals(true);
    try {
      const res = await api.getAdminWithdrawals();
      setWithdrawals(res.withdrawals);
    } catch {
      // ignore
    } finally {
      setIsLoadingWithdrawals(false);
    }
  };

  const loadReports = async () => {
    setIsLoadingReports(true);
    try {
      const res = await api.getAdminReports();
      setReports(res.reports);
    } catch {
      // ignore
    } finally {
      setIsLoadingReports(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await api.getAdminAuditLogs();
      setAuditLogs(res.auditLogs);
    } catch {
      // ignore
    }
  };

  // User Actions
  const handleUserAction = async (targetUserId: string, action: string, value?: any) => {
    try {
      await api.adminUserAction(targetUserId, action, value);
      await loadUsers();
      await loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Error al ejecutar acción');
    }
  };

  // Withdrawal Actions
  const handleWithdrawalAction = async (id: string, action: 'approve' | 'reject') => {
    const note = prompt(action === 'approve' ? 'Nota o referencia de pago:' : 'Motivo del rechazo (los fondos serán reembolsados al usuario):');
    if (note === null) return;

    try {
      await api.adminWithdrawalAction(id, action, note);
      await loadWithdrawals();
      await loadMetrics();
      await loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Error al procesar retiro');
    }
  };

  // Report Resolution
  const handleResolveReport = async (reportId: string, banUser: boolean) => {
    const actionTaken = prompt('Acción correctiva tomada:', banUser ? 'Usuario suspendido y contenido removido' : 'Revisión completada sin infracción');
    if (actionTaken === null) return;

    try {
      await api.resolveAdminReport(reportId, actionTaken, banUser);
      await loadReports();
      await loadUsers();
      await loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Error al resolver denuncia');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSavingSettings(true);
    try {
      await api.updateAdminSettings(settings);
      setSettingsMsg('¡Configuración de la plataforma actualizada!');
      await loadAuditLogs();
      setTimeout(() => setSettingsMsg(null), 3000);
    } catch (err: any) {
      setSettingsMsg(err.message || 'Error al actualizar');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 space-y-6">
      
      {/* SuperAdmin Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-950 border border-rose-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-2xl shadow-lg">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                SuperAdmin Control Central
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                PRODUCCIÓN ACTIVA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Supervisión en vivo de usuarios, comisiones, transferencias WebRTC y moderación.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateHome}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
        >
          Ir a la Góndola
        </button>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        {[
          { id: 'metrics', label: 'Métricas & Finanzas', icon: TrendingUp },
          { id: 'settings', label: 'Configuración & Toggles', icon: Sliders },
          { id: 'users', label: 'Gestión de Usuarios', icon: Users },
          { id: 'withdrawals', label: 'Cola de Retiros', icon: DollarSign, badge: metrics?.pendingWithdrawalsCount },
          { id: 'moderation', label: 'Denuncias & Moderación', icon: ShieldCheck, badge: metrics?.pendingReportsCount },
          { id: 'audit', label: 'Auditoría Administrativa', icon: FileText },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === t.id
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.badge && t.badge > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold">
                  {t.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* 1. METRICS TAB */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold block">Facturación Bruta (Volumen)</span>
              <div className="text-2xl font-extrabold text-white mt-1">
                ${metrics?.totalVolume?.toFixed(2) || '0.00'} <span className="text-xs text-slate-400">USD</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">Transacciones procesadas</span>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold block">Comisiones Ganadas</span>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                ${metrics?.totalCommissions?.toFixed(2) || '0.00'} <span className="text-xs text-slate-400">USD</span>
              </div>
              <span className="text-[10px] text-indigo-400 font-medium">Ingreso neto de plataforma</span>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold block">Usuarios Registrados</span>
              <div className="text-2xl font-extrabold text-white mt-1">
                {metrics?.totalUsers || 0}
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">
                {metrics?.activeProviders || 0} prestadores online
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold block">Videollamadas Totales</span>
              <div className="text-2xl font-extrabold text-indigo-400 mt-1">
                {metrics?.totalCalls || 0}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {metrics?.completedCalls || 0} finalizadas con éxito
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONFIGURATION & FEATURE TOGGLES */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {settingsMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{settingsMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Feature Flags Switches */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 text-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-rose-400" />
                <span>Interruptores Maestros de la Plataforma</span>
              </h3>

              <div className="space-y-2.5">
                {[
                  { key: 'isRegistrationEnabled', label: 'Registro de Nuevos Usuarios', desc: 'Permite que visitantes creen cuentas' },
                  { key: 'isVideoCallsEnabled', label: 'Servicio de Videollamadas', desc: 'Permite iniciar salas WebRTC con cobro' },
                  { key: 'isImageCatalogEnabled', label: 'Catálogo de Fotografías', desc: 'Permite que usuarios suban fotos' },
                  { key: 'isRechargeEnabled', label: 'Recargas de Saldo', desc: 'Habilita depósitos por tarjeta/cripto' },
                  { key: 'isWithdrawalsEnabled', label: 'Retiros de Fondos', desc: 'Permite solicitudes de liquidación' },
                  { key: 'autoApproveWithdrawals', label: 'Aprobación Automática de Retiros', desc: 'Liquida sin intervención manual' },
                ].map((toggle) => (
                  <label
                    key={toggle.key}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-white block">{toggle.label}</span>
                      <span className="text-[11px] text-slate-400">{toggle.desc}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={(settings as any)[toggle.key]}
                      onChange={(e) => setSettings({ ...settings, [toggle.key]: e.target.checked })}
                      className="accent-rose-500 w-4 h-4 rounded"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Economic Rules */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 text-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Comisiones y Parámetros Económicos</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Comisión General de Plataforma (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={settings.commissionPercent}
                    onChange={(e) => setSettings({ ...settings, commissionPercent: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Tarifa Mínima / min (USD)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={settings.minTariffPerMin}
                      onChange={(e) => setSettings({ ...settings, minTariffPerMin: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Tarifa Máxima / min (USD)</label>
                    <input
                      type="number"
                      step="1"
                      value={settings.maxTariffPerMin}
                      onChange={(e) => setSettings({ ...settings, maxTariffPerMin: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Retiro Mínimo (USD)</label>
                    <input
                      type="number"
                      value={settings.minWithdrawal}
                      onChange={(e) => setSettings({ ...settings, minWithdrawal: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Moneda Principal</label>
                    <input
                      type="text"
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white uppercase font-bold"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2 mt-4"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSettings ? 'Guardando...' : 'Aplicar Configuración Global'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 3. USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Directorio y Gestión de Usuarios ({usersList.length})
            </h3>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-white w-full sm:w-60"
              />
              <button
                onClick={loadUsers}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left divide-y divide-slate-800">
              <thead>
                <tr className="text-slate-400 font-semibold">
                  <th className="py-2.5">Usuario</th>
                  <th className="py-2.5">Rol</th>
                  <th className="py-2.5">Saldo</th>
                  <th className="py-2.5">Estado</th>
                  <th className="py-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="py-3 flex items-center gap-2.5">
                      <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-xl object-cover" />
                      <div>
                        <div className="font-bold text-white flex items-center gap-1">
                          <span>{u.alias || u.name}</span>
                          {u.isVerifiedBadge && <BadgeCheck className="w-3.5 h-3.5 text-sky-400" />}
                          {u.isFeatured && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                      </div>
                    </td>

                    <td className="py-3">
                      <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3 font-mono font-bold text-emerald-400">
                      ${u.walletBalance.toFixed(2)} USD
                    </td>

                    <td className="py-3">
                      {u.isBanned ? (
                        <span className="text-rose-400 font-bold">Bloqueado</span>
                      ) : u.isSuspended ? (
                        <span className="text-amber-400 font-bold">Suspendido</span>
                      ) : (
                        <span className="text-emerald-400 capitalize">{u.status}</span>
                      )}
                    </td>

                    <td className="py-3 text-right space-x-1">
                      <button
                        onClick={() => handleUserAction(u.id, 'toggle_verify')}
                        className={`p-1.5 rounded-lg border ${
                          u.isVerifiedBadge
                            ? 'bg-sky-950 border-sky-500 text-sky-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                        title={u.isVerifiedBadge ? 'Quitar verificación' : 'Verificar usuario'}
                      >
                        <BadgeCheck className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleUserAction(u.id, 'toggle_featured')}
                        className={`p-1.5 rounded-lg border ${
                          u.isFeatured
                            ? 'bg-amber-950 border-amber-500 text-amber-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                        title={u.isFeatured ? 'Quitar de destacados' : 'Destacar en góndola'}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleUserAction(u.id, 'toggle_ban')}
                        className={`p-1.5 rounded-lg border ${
                          u.isBanned
                            ? 'bg-rose-950 border-rose-500 text-rose-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400'
                        }`}
                        title={u.isBanned ? 'Desbloquear cuenta' : 'Bloquear / Banear'}
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. WITHDRAWALS QUEUE */}
      {activeTab === 'withdrawals' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Solicitudes de Retiro de Prestadores</span>
          </h3>

          {withdrawals.length === 0 ? (
            <div className="py-8 text-center text-slate-400">No hay solicitudes de retiro registradas.</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {withdrawals.map((w) => (
                <div key={w.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span>{w.userName}</span>
                      <span className="text-slate-400 text-xs">({w.userEmail})</span>
                      <span
                        className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                          w.status === 'approved'
                            ? 'bg-emerald-950 text-emerald-300'
                            : w.status === 'pending'
                            ? 'bg-amber-950 text-amber-300'
                            : 'bg-rose-950 text-rose-300'
                        }`}
                      >
                        {w.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-slate-300 mt-1">
                      Método: <strong className="uppercase">{w.method}</strong> • Destino: {w.accountDetails}
                    </div>
                    {w.notes && <div className="text-[11px] text-slate-400 mt-0.5">Nota: {w.notes}</div>}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="font-mono font-extrabold text-base text-emerald-400">
                      ${w.amount.toFixed(2)} USD
                    </div>

                    {w.status === 'pending' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleWithdrawalAction(w.id, 'approve')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Aprobar</span>
                        </button>
                        <button
                          onClick={() => handleWithdrawalAction(w.id, 'reject')}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Rechazar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. MODERATION & REPORTS */}
      {activeTab === 'moderation' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <span>Cola de Moderación y Denuncias de Usuarios</span>
          </h3>

          {reports.length === 0 ? (
            <div className="py-8 text-center text-slate-400">No hay denuncias pendientes de revisión.</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {reports.map((r) => (
                <div key={r.id} className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span className="text-rose-400">Denuncia contra: {r.reportedUserName}</span>
                      <span className="text-slate-400 text-xs">por {r.reporterName}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'resolved' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                    <div className="font-semibold text-rose-300 mb-0.5">Motivo: {r.reason}</div>
                    <p className="text-xs text-slate-300">{r.description}</p>
                    {r.actionTaken && (
                      <div className="mt-2 text-[11px] text-emerald-400 font-medium">
                        Resolución: {r.actionTaken}
                      </div>
                    )}
                  </div>

                  {r.status === 'pending' && (
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleResolveReport(r.id, false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                      >
                        Marcar Resuelto (Sin Sanción)
                      </button>
                      <button
                        onClick={() => handleResolveReport(r.id, true)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                      >
                        Sancionar y Bloquear Usuario
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Registro de Auditoría de Acciones Administrativas</span>
          </h3>

          <div className="divide-y divide-slate-800">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-white">{log.details}</div>
                  <div className="text-[10px] text-slate-400">{log.adminEmail} • Acción: {log.action}</div>
                </div>
                <div className="text-[10px] text-slate-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
