import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Globe,
  Shield,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Save,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const ALL_COUNTRIES = [
  { name: 'España', flag: '🇪🇸', code: 'ES' },
  { name: 'México', flag: '🇲🇽', code: 'MX' },
  { name: 'Argentina', flag: '🇦🇷', code: 'AR' },
  { name: 'Colombia', flag: '🇨🇴', code: 'CO' },
  { name: 'Chile', flag: '🇨🇱', code: 'CL' },
  { name: 'Estados Unidos', flag: '🇺🇸', code: 'US' },
  { name: 'Italia', flag: '🇮🇹', code: 'IT' },
  { name: 'Reino Unido', flag: '🇬🇧', code: 'GB' },
  { name: 'Francia', flag: '🇫🇷', code: 'FR' },
  { name: 'Alemania', flag: '🇩🇪', code: 'DE' },
  { name: 'Brasil', flag: '🇧🇷', code: 'BR' },
  { name: 'Perú', flag: '🇵🇪', code: 'PE' },
  { name: 'Uruguay', flag: '🇺🇾', code: 'UY' },
  { name: 'Ecuador', flag: '🇪🇨', code: 'EC' },
];

interface CountryFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const CountryFilterModal: React.FC<CountryFilterModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { user, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'visibility' | 'feed'>('visibility');

  // 1. Países que NO pueden ver mi perfil (geobloqueo de salida)
  const [excludedFromSeeingMe, setExcludedFromSeeingMe] = useState<string[]>([]);

  // 2. Países que el usuario NO quiere ver en su góndola (geobloqueo de entrada)
  const [excludedToSee, setExcludedToSee] = useState<string[]>([]);

  // 3. Países preferidos que desea ver
  const [preferredToSee, setPreferredToSee] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setExcludedFromSeeingMe(user.excludedCountriesFromSeeingMe || []);
      setExcludedToSee(user.excludedCountriesToSee || []);
      setPreferredToSee(user.preferredCountriesToSee || []);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const toggleExcludeFromSeeingMe = (countryName: string) => {
    setExcludedFromSeeingMe(prev =>
      prev.includes(countryName)
        ? prev.filter(c => c !== countryName)
        : [...prev, countryName]
    );
  };

  const toggleExcludeToSee = (countryName: string) => {
    setExcludedToSee(prev =>
      prev.includes(countryName)
        ? prev.filter(c => c !== countryName)
        : [...prev, countryName]
    );
  };

  const togglePreferredToSee = (countryName: string) => {
    setPreferredToSee(prev =>
      prev.includes(countryName)
        ? prev.filter(c => c !== countryName)
        : [...prev, countryName]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.updateCountrySettings({
        excludedCountriesFromSeeingMe: excludedFromSeeingMe,
        excludedCountriesToSee: excludedToSee,
        preferredCountriesToSee: preferredToSee,
      });
      await refreshUser();
      setSuccessMsg('¡Configuración de países guardada con éxito!');
      if (onSaved) onSaved();
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar configuración de países');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col text-slate-100 z-10 max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-indigo-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Configuración de Países & Privacidad</h3>
              <p className="text-xs text-slate-400">Controla quién te ve y qué países ves en Love Call</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-2 bg-slate-950/50 border-b border-slate-800/80 text-xs font-bold gap-2 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('visibility')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'visibility'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Quién Puede Verme ({excludedFromSeeingMe.length} excluidos)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'feed'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Países que Quiero Ver</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: GEOBLOQUEO DE SALIDA (Quién puede verme) */}
          {activeTab === 'visibility' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                <span className="font-bold text-white block text-sm flex items-center gap-1.5">
                  <EyeOff className="w-4 h-4 text-rose-400" />
                  <span>Excluir Países para Ocultar mi Perfil</span>
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Los usuarios registrados o que naveguen desde los países seleccionados <strong>no podrán ver tu perfil, fotos ni tarifas en Love Call</strong>.
                </p>
                {user?.country && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => toggleExcludeFromSeeingMe(user.country)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        excludedFromSeeingMe.includes(user.country)
                          ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <span>🔒 {excludedFromSeeingMe.includes(user.country) ? 'Mi país (' + user.country + ') está excluido' : 'Excluir mi país natal (' + user.country + ')'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Toca un país para excluir o desbloquear:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_COUNTRIES.map((c) => {
                    const isExcluded = excludedFromSeeingMe.includes(c.name);
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => toggleExcludeFromSeeingMe(c.name)}
                        className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all text-left ${
                          isExcluded
                            ? 'bg-rose-950/60 border-rose-500/70 text-rose-200 ring-1 ring-rose-500/40'
                            : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="text-base">{c.flag}</span>
                          <span className="truncate">{c.name}</span>
                        </span>
                        {isExcluded && (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-900/60 px-1.5 py-0.5 rounded ml-1">
                            Oculto
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GEOBLOQUEO DE ENTRADA (Países que quiero ver) */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                <span className="font-bold text-white block text-sm flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span>Filtrar la Góndola por Países</span>
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Personaliza qué prestadores aparecen al deslizar la góndola de Love Call. Puedes excluir países que no te interesen ver.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Países que NO deseas ver en el feed:
                  </label>
                  {excludedToSee.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExcludedToSee([])}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300"
                    >
                      Mostrar todos
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_COUNTRIES.map((c) => {
                    const isExcluded = excludedToSee.includes(c.name);
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => toggleExcludeToSee(c.name)}
                        className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all text-left ${
                          isExcluded
                            ? 'bg-amber-950/60 border-amber-500/70 text-amber-200 ring-1 ring-amber-500/40'
                            : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="text-base">{c.flag}</span>
                          <span className="truncate">{c.name}</span>
                        </span>
                        {isExcluded && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-900/60 px-1.5 py-0.5 rounded ml-1">
                            Excluido
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Preferencias de Países'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
