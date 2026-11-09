import React, { useState, useMemo } from 'react';
import { CallRequest, User } from '../types';
import {
  Video,
  Clock,
  DollarSign,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Radio,
  FileText,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Download,
  Printer,
  X,
  ExternalLink,
  Layers,
  ArrowUpDown,
  Sparkles
} from 'lucide-react';

interface CallHistorySectionProps {
  calls: CallRequest[];
  currentUser: User | null;
  onSelectProvider?: (providerId: string) => void;
  onOpenWallet?: () => void;
}

export const CallHistorySection: React.FC<CallHistorySectionProps> = ({
  calls,
  currentUser,
  onSelectProvider,
  onOpenWallet,
}) => {
  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'cancelled_or_interrupted'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'client' | 'provider'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'cost_desc' | 'cost_asc' | 'duration_desc' | 'duration_asc'>('newest');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedCallForReceipt, setSelectedCallForReceipt] = useState<CallRequest | null>(null);

  // Format seconds to "Xm Ys" or "X min"
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins} min`;
    return `${mins}m ${secs}s`;
  };

  // Format timestamp relative
  const formatRelativeTime = (isoDate: string) => {
    try {
      const diffMs = Date.now() - new Date(isoDate).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 2) return 'Hace un momento';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours} h`;
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `Hace ${diffDays} días`;
      return new Date(isoDate).toLocaleDateString([], { day: '2-digit', month: 'short' });
    } catch {
      return isoDate;
    }
  };

  // 1. KPI Aggregates for All user's calls
  const stats = useMemo(() => {
    const userCalls = calls.filter((c) => {
      if (!currentUser) return true;
      return c.clientId === currentUser.id || c.providerId === currentUser.id;
    });

    const totalCount = userCalls.length;
    const completedCalls = userCalls.filter((c) => c.status === 'completed');
    const cancelledCalls = userCalls.filter((c) => c.status === 'cancelled' || c.status === 'rejected');
    const inProgressCalls = userCalls.filter((c) => c.status === 'in_progress');

    // Total actual seconds
    const totalActualSeconds = userCalls.reduce((acc, c) => acc + (c.actualSecondsUsed || 0), 0);
    const totalHours = Math.floor(totalActualSeconds / 3600);
    const remainingMins = Math.floor((totalActualSeconds % 3600) / 60);
    const remainingSecs = totalActualSeconds % 60;

    // Financial calculations
    let totalCostIncurredAsClient = 0;
    let totalEarningsAsProvider = 0;

    userCalls.forEach((c) => {
      if (currentUser && c.clientId === currentUser.id) {
        totalCostIncurredAsClient += c.totalAmount || 0;
      }
      if (currentUser && c.providerId === currentUser.id) {
        totalEarningsAsProvider += c.providerAmount || 0;
      }
      // If no currentUser or superadmin, sum totalAmount
      if (!currentUser) {
        totalCostIncurredAsClient += c.totalAmount || 0;
      }
    });

    const isProvider = currentUser?.role === 'prestador';
    const mainFinancialMetric = isProvider ? totalEarningsAsProvider : totalCostIncurredAsClient;

    const avgDurationSeconds = completedCalls.length > 0 ? Math.round(totalActualSeconds / completedCalls.length) : 0;
    const avgCostPerCall = completedCalls.length > 0 ? mainFinancialMetric / completedCalls.length : 0;

    return {
      totalCount,
      completedCount: completedCalls.length,
      cancelledCount: cancelledCalls.length,
      inProgressCount: inProgressCalls.length,
      totalActualSeconds,
      totalHours,
      remainingMins,
      remainingSecs,
      totalCostIncurredAsClient,
      totalEarningsAsProvider,
      mainFinancialMetric,
      avgDurationSeconds,
      avgCostPerCall,
    };
  }, [calls, currentUser]);

  // 2. Filter & Sort Calls
  const filteredCalls = useMemo(() => {
    return calls.filter((c) => {
      // Must be relevant to user
      const isClient = currentUser ? c.clientId === currentUser.id : false;
      const isProvider = currentUser ? c.providerId === currentUser.id : false;
      if (currentUser && !isClient && !isProvider) return false;

      // Role filter
      if (roleFilter === 'client' && !isClient) return false;
      if (roleFilter === 'provider' && !isProvider) return false;

      // Status filter
      if (statusFilter === 'completed' && c.status !== 'completed') return false;
      if (statusFilter === 'in_progress' && c.status !== 'in_progress') return false;
      if (statusFilter === 'cancelled_or_interrupted') {
        if (c.status !== 'cancelled' && c.status !== 'rejected' && c.status !== 'interrupted') {
          return false;
        }
      }

      // Date filter
      if (dateFilter !== 'all') {
        const callTime = new Date(c.createdAt).getTime();
        const now = Date.now();
        if (dateFilter === '24h' && now - callTime > 86400000) return false;
        if (dateFilter === '7d' && now - callTime > 86400000 * 7) return false;
        if (dateFilter === '30d' && now - callTime > 86400000 * 30) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesClient = c.clientName?.toLowerCase().includes(term);
        const matchesProvider = c.providerName?.toLowerCase().includes(term);
        const matchesCallId = c.callId?.toLowerCase().includes(term);
        const matchesId = c.id?.toLowerCase().includes(term);
        if (!matchesClient && !matchesProvider && !matchesCallId && !matchesId) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'cost_desc') {
        return b.totalAmount - a.totalAmount;
      }
      if (sortBy === 'cost_asc') {
        return a.totalAmount - b.totalAmount;
      }
      if (sortBy === 'duration_desc') {
        return b.actualSecondsUsed - a.actualSecondsUsed;
      }
      if (sortBy === 'duration_asc') {
        return a.actualSecondsUsed - b.actualSecondsUsed;
      }
      return 0;
    });
  }, [calls, currentUser, searchTerm, statusFilter, roleFilter, dateFilter, sortBy]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Costo Incurrido / Ganancias */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {currentUser?.role === 'prestador' ? 'Ganancias Incurridas' : 'Costo Total Incurrido'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            ${stats.mainFinancialMetric.toFixed(2)}{' '}
            <span className="text-xs font-bold text-emerald-400">USD</span>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Promedio / llamada:</span>
            <span className="font-bold text-emerald-300 font-mono">
              ${stats.avgCostPerCall.toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* KPI 2: Tiempo Total Incurrido */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Duración Total Conectada
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            {stats.totalHours > 0 && `${stats.totalHours}h `}
            {stats.remainingMins}m {stats.remainingSecs}s
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Duración promedio:</span>
            <span className="font-bold text-indigo-300 font-mono">
              {formatDuration(stats.avgDurationSeconds)}
            </span>
          </div>
        </div>

        {/* KPI 3: Total Sesiones & Estado */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Sesiones Registradas
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
              <Video className="w-4 h-4 text-purple-400" />
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            {stats.totalCount}
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> {stats.completedCount} completadas
            </span>
            {stats.cancelledCount > 0 && (
              <span className="text-slate-400">
                {stats.cancelledCount} canceladas
              </span>
            )}
          </div>
        </div>

        {/* KPI 4: Garantía de Facturación Segura */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Custodia Antifraude
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
          </div>

          <div className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5 mt-1">
            <span className="text-emerald-400 font-extrabold">100% Protegido</span>
          </div>

          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
            Tarificación estricta por segundo conectado. Reembolso automático si la llamada finaliza antes.
          </p>
        </div>
      </div>

      {/* 2. Interactive Search & Filters Bar */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        
        {/* Top Controls Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, sala o código de llamada..."
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick View Mode Toggle */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="flex items-center p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-xl transition-all font-semibold flex items-center gap-1.5 ${
                  viewMode === 'cards'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Tarjetas</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-xl transition-all font-semibold flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Tabla</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills & Sorting Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          
          {/* Filter: Status */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Estado de la Sesión
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Todas las sesiones ({stats.totalCount})</option>
              <option value="completed">Completadas ({stats.completedCount})</option>
              <option value="in_progress">En curso activa ({stats.inProgressCount})</option>
              <option value="cancelled_or_interrupted">Canceladas / Interrumpidas ({stats.cancelledCount})</option>
            </select>
          </div>

          {/* Filter: Role */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Tipo / Participación
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="client">Como Cliente (Gastos incurridos)</option>
              <option value="provider">Como Prestador (Ingresos recibidos)</option>
            </select>
          </div>

          {/* Filter: Date Range */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Periodo
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Todo el historial</option>
              <option value="24h">Últimas 24 horas</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-indigo-400" />
              <span>Ordenar por</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="newest">Más recientes primero</option>
              <option value="cost_desc">Mayor costo incurrido ($)</option>
              <option value="cost_asc">Menor costo incurrido ($)</option>
              <option value="duration_desc">Mayor duración conectada</option>
              <option value="duration_asc">Menor duración conectada</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Empty State or Results List */}
      {filteredCalls.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
            <Video className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">No se encontraron videollamadas</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No hay registros que coincidan con los filtros seleccionados o tu historial aún no tiene llamadas.
          </p>
          {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all' || dateFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setRoleFilter('all');
                setDateFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              Restablecer Filtros
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        
        /* 4. CARDS VIEW: Rich Interactive Call Cards */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Mostrando <strong className="text-white">{filteredCalls.length}</strong> videollamada{filteredCalls.length === 1 ? '' : 's'}</span>
            <span>Total incurrido en selección: <strong className="text-emerald-400 font-mono">${filteredCalls.reduce((acc, c) => acc + (currentUser?.id === c.providerId ? c.providerAmount : c.totalAmount), 0).toFixed(2)} USD</strong></span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredCalls.map((call) => {
              const isProviderOfCall = currentUser?.id === call.providerId;
              const otherPartyName = isProviderOfCall ? call.clientName : call.providerName;
              const otherPartyAvatar = isProviderOfCall ? call.clientAvatar : call.providerAvatar;
              const otherPartyId = isProviderOfCall ? call.clientId : call.providerId;

              // Calculate percentage of contracted duration consumed
              const contractedSeconds = (call.durationMinutes || 1) * 60;
              const actualSecs = call.actualSecondsUsed || 0;
              const consumptionPercent = Math.min(100, Math.round((actualSecs / contractedSeconds) * 100));

              // Effective rate per minute incurred
              const ratePerMin = call.actualSecondsUsed > 0
                ? (call.totalAmount / (call.actualSecondsUsed / 60)).toFixed(2)
                : (call.totalAmount / (call.durationMinutes || 1)).toFixed(2);

              return (
                <div
                  key={call.id}
                  className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all shadow-xl space-y-4"
                >
                  {/* Card Top: Counterpart Info + Status Badge + Date */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    
                    <div className="flex items-center gap-3.5">
                      <img
                        src={otherPartyAvatar}
                        alt={otherPartyName}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-800 shadow-md"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-white text-sm sm:text-base">
                            {otherPartyName}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              isProviderOfCall
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            {isProviderOfCall ? 'Te contrató' : 'Contrataste a'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {new Date(call.createdAt).toLocaleDateString([], {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400 font-medium">{formatRelativeTime(call.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                          call.status === 'completed'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                            : call.status === 'in_progress'
                            ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 animate-pulse'
                            : call.status === 'interrupted'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {call.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {call.status === 'in_progress' && <Radio className="w-3.5 h-3.5 text-indigo-400" />}
                        {call.status === 'interrupted' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                        {call.status === 'cancelled' && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                        <span className="capitalize">
                          {call.status === 'completed'
                            ? 'Completada'
                            : call.status === 'in_progress'
                            ? 'En Curso'
                            : call.status === 'interrupted'
                            ? 'Interrumpida'
                            : 'Cancelada'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Middle: Detailed Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs">
                    
                    {/* Metric 1: Duración Conectada */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Duración Conectada
                      </span>
                      <div className="font-mono font-extrabold text-sm sm:text-base text-white flex items-baseline gap-1">
                        <span>{formatDuration(call.actualSecondsUsed)}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {call.actualSecondsUsed} segundos reales
                      </span>
                    </div>

                    {/* Metric 2: Tiempo Contratado */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Tiempo Contratado
                      </span>
                      <div className="font-mono font-bold text-sm sm:text-base text-slate-300">
                        {call.durationMinutes} min
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {consumptionPercent}% consumido
                      </span>
                    </div>

                    {/* Metric 3: Costo Incurrido */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                        {isProviderOfCall ? 'Ganancia Neta' : 'Costo Incurrido'}
                      </span>
                      <div
                        className={`font-mono font-extrabold text-sm sm:text-base ${
                          isProviderOfCall ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {isProviderOfCall
                          ? `+$${call.providerAmount.toFixed(2)}`
                          : `$${call.totalAmount.toFixed(2)}`}{' '}
                        <span className="text-[10px] font-normal text-slate-400">USD</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Tarifa: ${ratePerMin}/min
                      </span>
                    </div>

                    {/* Metric 4: Comisión / Liquidación */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                        {isProviderOfCall ? 'Comisión Retenida' : 'Liquidación Final'}
                      </span>
                      <div className="font-mono font-bold text-sm sm:text-base text-slate-300">
                        {isProviderOfCall ? `-$${call.commissionAmount.toFixed(2)}` : 'Cobrado 100%'}
                      </div>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Verificado P2P
                      </span>
                    </div>
                  </div>

                  {/* Consumo Progress Bar & Disconnect Reason */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Consumo de tiempo de la sesión:</span>
                      <span className="font-semibold text-slate-300">
                        {formatDuration(call.actualSecondsUsed)} de {call.durationMinutes} min ({consumptionPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          consumptionPercent >= 90
                            ? 'bg-emerald-500'
                            : consumptionPercent >= 50
                            ? 'bg-indigo-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${consumptionPercent}%` }}
                      />
                    </div>
                    {call.disconnectReason && (
                      <p className="text-[11px] text-slate-400 italic pt-0.5">
                        Motivo registrado: {call.disconnectReason}
                      </p>
                    )}
                  </div>

                  {/* Card Bottom: Room code & Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-800/80">
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                      <span>Sala: {call.callId}</span>
                      <span>•</span>
                      <span className="text-slate-400">Cifrado WebRTC de Extremo a Extremo</span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedCallForReceipt(call)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors border border-slate-700"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Ver Ficha / Recibo</span>
                      </button>

                      {!isProviderOfCall && onSelectProvider && (
                        <button
                          type="button"
                          onClick={() => onSelectProvider(otherPartyId)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Volver a Contratar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        
        /* 5. TABLE VIEW: Compact Corporate Table */
        <div className="overflow-x-auto rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Participante</th>
                <th className="py-3.5 px-4">Fecha & Hora</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-center">Duración Conectada</th>
                <th className="py-3.5 px-4 text-center">Tiempo Contratado</th>
                <th className="py-3.5 px-4 text-right">Costo Incurrido</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredCalls.map((call) => {
                const isProviderOfCall = currentUser?.id === call.providerId;
                const otherPartyName = isProviderOfCall ? call.clientName : call.providerName;
                const otherPartyAvatar = isProviderOfCall ? call.clientAvatar : call.providerAvatar;
                const otherPartyId = isProviderOfCall ? call.clientId : call.providerId;

                return (
                  <tr key={call.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Participant */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={otherPartyAvatar}
                          alt={otherPartyName}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700"
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{otherPartyName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {isProviderOfCall ? 'Cliente' : 'Prestador'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>
                        {new Date(call.createdAt).toLocaleDateString([], {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(call.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          call.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : call.status === 'in_progress'
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-800 animate-pulse'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <span className="capitalize">{call.status}</span>
                      </span>
                    </td>

                    {/* Duration Connected */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                      {formatDuration(call.actualSecondsUsed)}
                    </td>

                    {/* Contracted */}
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                      {call.durationMinutes} min
                    </td>

                    {/* Total Cost Incurred */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-mono font-bold text-sm text-emerald-400">
                        {isProviderOfCall
                          ? `+$${call.providerAmount.toFixed(2)}`
                          : `$${call.totalAmount.toFixed(2)}`}{' '}
                        <span className="text-[10px] text-slate-400">USD</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCallForReceipt(call)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Ver Ficha / Recibo"
                        >
                          <FileText className="w-4 h-4 text-indigo-400" />
                        </button>

                        {!isProviderOfCall && onSelectProvider && (
                          <button
                            type="button"
                            onClick={() => onSelectProvider(otherPartyId)}
                            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                            title="Volver a Contratar"
                          >
                            <Video className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. MODAL: Ficha y Recibo Detallado de Sesión */}
      {selectedCallForReceipt && (
        <CallReceiptModal
          call={selectedCallForReceipt}
          currentUser={currentUser}
          onClose={() => setSelectedCallForReceipt(null)}
          onSelectProvider={onSelectProvider}
        />
      )}
    </div>
  );
};

/* -------------------------------------------------------------
 * MODAL: Ficha y Recibo Digital de Facturación
 * ------------------------------------------------------------- */
interface CallReceiptModalProps {
  call: CallRequest;
  currentUser: User | null;
  onClose: () => void;
  onSelectProvider?: (providerId: string) => void;
}

const CallReceiptModal: React.FC<CallReceiptModalProps> = ({
  call,
  currentUser,
  onClose,
  onSelectProvider,
}) => {
  const isProviderOfCall = currentUser?.id === call.providerId;

  const formatSecs = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} seg (${seconds}s)`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col text-slate-100 z-10">
        
        {/* Top Header */}
        <div className="p-5 pb-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm">Comprobante Oficial de Videollamada</h3>
              <p className="text-[11px] text-slate-400 font-mono">Ref: {call.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          
          {/* Certificate Badge */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-950 to-indigo-950/60 border border-emerald-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="font-extrabold text-white block">Sesión Verificada P2P</span>
                <span className="text-[10px] text-slate-400">Cifrado WebRTC de extremo a extremo</span>
              </div>
            </div>
            <span className="font-mono text-[11px] font-bold text-emerald-300 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700">
              {call.status.toUpperCase()}
            </span>
          </div>

          {/* Participants Breakdown */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Cliente Solicitante</span>
              <div className="flex items-center gap-2">
                <img src={call.clientAvatar} alt={call.clientName} className="w-7 h-7 rounded-lg object-cover" />
                <span className="font-bold text-white truncate">{call.clientName}</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Prestador Profesional</span>
              <div className="flex items-center gap-2">
                <img src={call.providerAvatar} alt={call.providerName} className="w-7 h-7 rounded-lg object-cover" />
                <span className="font-bold text-white truncate">{call.providerName}</span>
              </div>
            </div>
          </div>

          {/* Chronological Timeline */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <h5 className="font-bold text-slate-300 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Registro Cronológico de Conexión</span>
            </h5>
            
            <div className="flex justify-between text-slate-400">
              <span>Fecha de Solicitud:</span>
              <span className="text-white font-mono">{new Date(call.createdAt).toLocaleString()}</span>
            </div>
            {call.startedAt && (
              <div className="flex justify-between text-slate-400">
                <span>Conexión de Audio/Video:</span>
                <span className="text-white font-mono">{new Date(call.startedAt).toLocaleTimeString()}</span>
              </div>
            )}
            {call.endedAt && (
              <div className="flex justify-between text-slate-400">
                <span>Cierre de Sala:</span>
                <span className="text-white font-mono">{new Date(call.endedAt).toLocaleTimeString()}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400 border-t border-slate-800/80 pt-2">
              <span>Tiempo Contratado:</span>
              <span className="text-slate-200 font-bold">{call.durationMinutes} minutos</span>
            </div>
            <div className="flex justify-between text-indigo-300 font-bold">
              <span>Duración Real Conectada:</span>
              <span className="font-mono text-emerald-400">{formatSecs(call.actualSecondsUsed)}</span>
            </div>
            {call.disconnectReason && (
              <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/60">
                Cierre: {call.disconnectReason}
              </div>
            )}
          </div>

          {/* Itemized Financial Breakdown */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <h5 className="font-bold text-slate-300 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Desglose Económico Liquidado</span>
            </h5>

            <div className="flex justify-between text-slate-400">
              <span>Costo Total Incurrido (Cliente):</span>
              <span className="font-mono font-bold text-white">${call.totalAmount.toFixed(2)} USD</span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>Comisión de Plataforma (15%):</span>
              <span className="font-mono text-slate-300">-${call.commissionAmount.toFixed(2)} USD</span>
            </div>

            <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-extrabold text-emerald-400">
              <span>Ganancia Acreditada al Prestador:</span>
              <span className="font-mono">+${call.providerAmount.toFixed(2)} USD</span>
            </div>
          </div>

          {/* Cryptographic watermark / Room code */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[10px] text-slate-500 font-mono text-center">
            ROOM ID: {call.callId} • HASH: {call.id.slice(0, 16)} • SERVIDOR WEBRTC SEGURO
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>

          <div className="flex items-center gap-2">
            {!isProviderOfCall && onSelectProvider && (
              <button
                type="button"
                onClick={() => {
                  onSelectProvider(call.providerId);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-extrabold text-white flex items-center gap-1.5 transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Volver a Contratar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
