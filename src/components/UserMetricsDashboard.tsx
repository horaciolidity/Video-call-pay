import React, { useState, useMemo } from 'react';
import { CallRequest, User } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell
} from 'recharts';
import {
  DollarSign,
  Clock,
  Video,
  TrendingUp,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  BarChart3
} from 'lucide-react';

interface UserMetricsDashboardProps {
  calls: CallRequest[];
  user: User | null;
  onOpenWallet?: () => void;
}

export const UserMetricsDashboard: React.FC<UserMetricsDashboardProps> = ({
  calls,
  user,
  onOpenWallet,
}) => {
  const [chartMetric, setChartMetric] = useState<'both' | 'earnings' | 'minutes'>('both');

  const isProvider = user?.role === 'prestador' || user?.role === 'superadmin';

  // 1. Calculate KPI Metrics
  const metrics = useMemo(() => {
    // Filter completed calls for this user
    const relevantCalls = calls.filter((c) => {
      const isParticipant = user ? c.clientId === user.id || c.providerId === user.id : true;
      return isParticipant && (c.status === 'completed' || c.actualSecondsUsed > 0);
    });

    // Total Earnings (for providers) or Total Spent (for clients)
    const totalEarnings = relevantCalls.reduce((acc, c) => {
      if (isProvider) {
        return acc + (c.providerId === user?.id ? c.providerAmount : 0);
      } else {
        return acc + (c.clientId === user?.id ? c.totalAmount : 0);
      }
    }, 0);

    // Total Seconds used
    const totalSeconds = relevantCalls.reduce((acc, c) => acc + (c.actualSecondsUsed || 0), 0);
    const totalMinutes = Math.round(totalSeconds / 60);

    // Average Call Duration in minutes & seconds
    const completedCount = relevantCalls.length;
    const avgSeconds = completedCount > 0 ? Math.round(totalSeconds / completedCount) : 0;
    const avgMinutes = Math.floor(avgSeconds / 60);
    const avgRemainingSeconds = avgSeconds % 60;

    return {
      completedCount,
      totalEarnings,
      totalMinutes,
      avgMinutes,
      avgRemainingSeconds,
      avgSeconds,
      relevantCalls,
    };
  }, [calls, user, isProvider]);

  // 2. Build 7-Day Activity Dataset for Recharts
  const last7DaysData = useMemo(() => {
    const days: {
      dateKey: string;
      label: string;
      dayOfWeek: string;
      fullDate: string;
      earnings: number;
      minutes: number;
      callsCount: number;
    }[] = [];

    const now = new Date();
    // Days array from 6 days ago up to today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateKey = d.toISOString().split('T')[0];

      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

      const isToday = i === 0;
      const isYesterday = i === 1;

      const label = isToday
        ? 'Hoy'
        : isYesterday
        ? 'Ayer'
        : `${dayNames[d.getDay()]} ${d.getDate()}`;

      days.push({
        dateKey,
        label,
        dayOfWeek: dayNames[d.getDay()],
        fullDate: `${d.getDate()} de ${monthNames[d.getMonth()]}`,
        earnings: 0,
        minutes: 0,
        callsCount: 0,
      });
    }

    // Populate data from user's calls
    calls.forEach((c) => {
      const isParticipant = user ? c.clientId === user.id || c.providerId === user.id : true;
      if (!isParticipant) return;

      const callDateStr = c.createdAt ? c.createdAt.split('T')[0] : '';
      const dayBucket = days.find((d) => d.dateKey === callDateStr);

      if (dayBucket) {
        dayBucket.callsCount += 1;
        const callMins = Math.round((c.actualSecondsUsed || c.durationMinutes * 60) / 60);
        dayBucket.minutes += callMins;

        if (isProvider) {
          dayBucket.earnings += c.providerId === user?.id ? c.providerAmount : 0;
        } else {
          dayBucket.earnings += c.clientId === user?.id ? c.totalAmount : 0;
        }
      }
    });

    // Round earnings to 2 decimal places
    return days.map((d) => ({
      ...d,
      earnings: Number(d.earnings.toFixed(2)),
    }));
  }, [calls, user, isProvider]);

  // Find peak day
  const peakDay = useMemo(() => {
    let maxDay = last7DaysData[0];
    last7DaysData.forEach((d) => {
      if (d.earnings > (maxDay?.earnings || 0)) {
        maxDay = d;
      }
    });
    return maxDay;
  }, [last7DaysData]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      return (
        <div className="rounded-2xl bg-slate-900/95 border border-slate-700/80 p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[180px]">
          <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>{dataItem.label}</span>
            <span className="text-[10px] text-slate-400 font-normal">{dataItem.fullDate}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-emerald-400">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                {isProvider ? 'Ganancias:' : 'Invertido:'}
              </span>
              <span className="font-mono font-extrabold">${dataItem.earnings.toFixed(2)} USD</span>
            </div>

            <div className="flex items-center justify-between gap-3 text-indigo-300">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
                Duración:
              </span>
              <span className="font-mono font-extrabold">{dataItem.minutes} min</span>
            </div>

            <div className="flex items-center justify-between gap-3 text-slate-300 text-[11px] pt-1 border-t border-slate-800/60">
              <span className="flex items-center gap-1.5">
                <Video className="w-3 h-3 text-slate-400" />
                Videollamadas:
              </span>
              <span className="font-bold">{dataItem.callsCount} sesión{dataItem.callsCount === 1 ? '' : 'es'}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Executive KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Earnings / Total Spent */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-900/40 p-5 shadow-xl">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isProvider ? 'Ganancias Totales por Llamadas' : 'Total Invertido en Llamadas'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            ${metrics.totalEarnings.toFixed(2)}{' '}
            <span className="text-xs font-bold text-emerald-400 ml-0.5">USD</span>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>En {metrics.completedCount} videollamadas</span>
            {onOpenWallet && (
              <button
                onClick={onOpenWallet}
                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5"
              >
                <span>Billetera</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* KPI 2: Average Call Duration */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-900/40 p-5 shadow-xl">
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Duración Promedio
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            {metrics.avgMinutes}m {metrics.avgRemainingSeconds.toString().padStart(2, '0')}s
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Tiempo acumulado:</span>
            <span className="font-bold text-indigo-300">{metrics.totalMinutes} minutos</span>
          </div>
        </div>

        {/* KPI 3: Total Completed Calls */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-950 border border-purple-900/40 p-5 shadow-xl">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sesiones Realizadas
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
              <Video className="w-4 h-4 text-purple-400" />
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            {metrics.completedCount}
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Conexión 1 a 1:</span>
            <span className="font-bold text-purple-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> WebRTC HD
            </span>
          </div>
        </div>

        {/* KPI 4: Peak Activity Day */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border border-amber-900/40 p-5 shadow-xl">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Día de Mayor Actividad
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
          </div>

          <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-baseline gap-1.5">
            <span>{peakDay?.label || 'Sin datos'}</span>
            <span className="text-xs font-bold text-amber-400 font-mono">
              (${peakDay?.earnings?.toFixed(2) || '0.00'})
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Récord semanal:</span>
            <span className="font-bold text-amber-300">{peakDay?.minutes || 0} min en llamada</span>
          </div>
        </div>
      </div>

      {/* Main 7-Day Activity Chart Card */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-5">
        
        {/* Chart Header & Toggle Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-extrabold text-white">
                Actividad de los Últimos 7 Días
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Evolución diaria de {isProvider ? 'ingresos generados' : 'consumo'} y minutos conversados en videollamadas.
            </p>
          </div>

          {/* Metric Selector Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChartMetric('both')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                chartMetric === 'both'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ambos
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('earnings')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                chartMetric === 'earnings'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Ingresos ($)</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('minutes')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                chartMetric === 'minutes'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>Minutos</span>
            </button>
          </div>
        </div>

        {/* Recharts Responsive Container */}
        <div className="h-72 sm:h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={last7DaysData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              barGap={6}
            >
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="minutesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#4338ca" stopOpacity={0.4} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.6} />

              <XAxis
                dataKey="label"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />

              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => (chartMetric === 'minutes' ? `${val}m` : `$${val}`)}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                wrapperStyle={{ paddingTop: '14px', fontSize: '11px', color: '#94a3b8' }}
                iconType="circle"
              />

              {(chartMetric === 'both' || chartMetric === 'earnings') && (
                <Bar
                  dataKey="earnings"
                  name={isProvider ? 'Ingresos ($ USD)' : 'Invertido ($ USD)'}
                  fill="url(#earningsGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
              )}

              {(chartMetric === 'both' || chartMetric === 'minutes') && (
                <Bar
                  dataKey="minutes"
                  name="Tiempo en Llamada (min)"
                  fill="url(#minutesGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 7-Day Numerical Breakdown Cards */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {last7DaysData.map((d) => (
              <div
                key={d.dateKey}
                className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center space-y-1 hover:border-slate-700 transition-colors"
              >
                <div className="text-[11px] font-bold text-slate-300">{d.label}</div>
                <div className="text-xs font-mono font-extrabold text-emerald-400">
                  ${d.earnings.toFixed(2)}
                </div>
                <div className="text-[10px] text-indigo-300 font-medium">
                  {d.minutes} min ({d.callsCount})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
