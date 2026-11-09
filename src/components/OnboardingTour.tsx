import React, { useState, useEffect } from 'react';
import {
  Video,
  Search,
  Wallet,
  User as UserIcon,
  Sparkles,
  Flame,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  Zap,
  Clock,
  Compass
} from 'lucide-react';

export interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: 'marketplace' | 'dashboard' | 'superadmin') => void;
  onOpenWallet: () => void;
  userName?: string;
}

interface TourStep {
  id: string;
  tag: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badge: string;
  highlights: string[];
  ctaLabel?: string;
  action?: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenWallet,
  userName = 'Usuario',
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps: TourStep[] = [
    {
      id: 'welcome',
      tag: '¡Te damos la bienvenida!',
      title: `Hola, ${userName} 👋 Descubre Love Call`,
      description:
        'Tu plataforma tipo góndola donde descubrir perfiles destacados, ver catálogos fotográficos en alta resolución y conectar en videollamadas privadas por tiempo.',
      icon: Video,
      iconBg: 'from-indigo-600 to-rose-600',
      iconColor: 'text-white',
      badge: 'Marketplace 1 a 1',
      highlights: [
        'Videollamadas WebRTC de alta definición con sala privada cifrada',
        'Fotografías ampliadas en catálogo con modo público o exclusivo',
        'Garantía antifraude con cobro por tiempo real conectado',
      ],
    },
    {
      id: 'search',
      tag: 'Buscador Predictivo',
      title: 'Buscador Inteligente con Sugerencias en Tiempo Real',
      description:
        'Encuentra exactamente a quien buscas. Al escribir en el Navbar verás sugerencias instantáneas: perfiles populares, nuevos ingresos, prestadores 5 estrellas o disponibles online.',
      icon: Search,
      iconBg: 'from-amber-500 to-orange-600',
      iconColor: 'text-white',
      badge: 'Filtros Dinámicos',
      highlights: [
        'Categorías rápidas: "Popular", "New", "Highest Rated" y "Online Ahora"',
        'Búsqueda predictiva con fotos, medallas de verificación y tarifas',
        'Acceso directo a cualquier perfil desde el menú desplegable',
      ],
      ctaLabel: 'Explorar en la Góndola',
      action: () => {
        onNavigate('marketplace');
        onClose();
      },
    },
    {
      id: 'wallet',
      tag: 'Finanzas & Seguridad',
      title: 'Billetera Digital Integrada y Pagos Protegidos',
      description:
        'Recarga saldo de manera segura mediante Tarjeta, PayPal o Cripto USDT. Tu dinero se custodia en la plataforma y solo se consume los segundos que dure la llamada.',
      icon: Wallet,
      iconBg: 'from-emerald-500 to-teal-600',
      iconColor: 'text-white',
      badge: 'Protección Antifraude',
      highlights: [
        'Si la llamada se corta o desconecta, el contador se detiene al instante',
        'Retiros rápidos para prestadores con aprobación transparente',
        'Libro mayor con historial detallado de cada consumo y honorario',
      ],
      ctaLabel: 'Abrir Billetera',
      action: () => {
        onOpenWallet();
        onClose();
      },
    },
    {
      id: 'dashboard',
      tag: 'Gestión & Analítica',
      title: 'Mi Escaparate y Panel de Rendimiento (7 Días)',
      description:
        'Personaliza tu perfil público, sube imágenes optimizadas a tu catálogo, define tus tarifas por minuto y analiza tu actividad con el gráfico interactivo de los últimos 7 días.',
      icon: BarChart3,
      iconBg: 'from-purple-600 to-indigo-600',
      iconColor: 'text-white',
      badge: 'Gráficos Recharts',
      highlights: [
        'Métricas de ganancias totales y duración promedio de llamada',
        'Historial detallado con duración exacta por segundo y costos incurridos',
        'Comprobantes y recibos digitales oficiales con desglose de liquidación',
      ],
      ctaLabel: 'Ver Mi Panel',
      action: () => {
        onNavigate('dashboard');
        onClose();
      },
    },
  ];

  // Reset step when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      }
      if (e.key === 'ArrowLeft' && currentStepIndex > 0) {
        setCurrentStepIndex(prev => prev - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, steps.length, onClose]);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];
  const StepIcon = currentStep.icon;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      
      {/* Spotlight glow behind the card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col text-slate-100 z-10">
        
        {/* Top Header Strip */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-extrabold flex items-center gap-1.5 uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tour de Bienvenida</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Paso {currentStepIndex + 1} de {steps.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Saltar tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators Bar */}
        <div className="grid grid-cols-4 gap-1 px-6 pt-3">
          {steps.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => setCurrentStepIndex(idx)}
              className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 ${
                idx === currentStepIndex
                  ? 'bg-gradient-to-r from-indigo-500 to-rose-500'
                  : idx < currentStepIndex
                  ? 'bg-emerald-500/80'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Tour Step Main Content */}
        <div className="p-6 sm:p-7 space-y-5">
          
          {/* Step Icon & Badge */}
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${currentStep.iconBg} flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0`}
            >
              <StepIcon className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-bold text-indigo-400 block uppercase tracking-wider">
                {currentStep.tag}
              </span>
              <div className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-300">
                {currentStep.badge}
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
              {currentStep.title}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Bulleted Feature Highlights */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            {currentStep.highlights.map((highlight, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{highlight}</span>
              </div>
            ))}
          </div>

          {/* Contextual Shortcut Action Button if step has one */}
          {currentStep.action && (
            <div className="pt-1">
              <button
                type="button"
                onClick={currentStep.action}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-indigo-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>{currentStep.ctaLabel || 'Probar esta función ahora'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-6 pt-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white font-medium px-2 py-1 transition-colors"
          >
            Saltar Tour
          </button>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span>{isLastStep ? '¡Comenzar a Explorar!' : 'Siguiente'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
