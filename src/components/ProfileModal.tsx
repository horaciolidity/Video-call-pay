import React, { useState, useEffect } from 'react';
import { User, Photo, Tariff, EnrichedProvider } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  X,
  CheckCircle2,
  Star,
  MapPin,
  Globe,
  Clock,
  Video,
  Wallet,
  ShieldAlert,
  Lock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Info
} from 'lucide-react';

interface ProfileModalProps {
  providerId: string;
  onClose: () => void;
  onRequestCall: (providerId: string, durationMinutes: number) => void;
  onOpenWallet: () => void;
  onOpenAuth: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  providerId,
  onClose,
  onRequestCall,
  onOpenWallet,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const [provider, setProvider] = useState<User | null>(null);
  const [tariff, setTariff] = useState<Tariff | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Booking & duration state
  const [selectedDuration, setSelectedDuration] = useState<number>(10);
  const [estimate, setEstimate] = useState<{ totalAmount: number; commissionAmount: number; providerAmount: number } | null>(null);

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Comportamiento inapropiado');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    loadProviderDetails();
  }, [providerId]);

  useEffect(() => {
    if (provider && tariff) {
      calculateEstimate(selectedDuration);
    }
  }, [provider, tariff, selectedDuration]);

  const loadProviderDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.getProviderById(providerId);
      setProvider(res.provider);
      setTariff(res.tariff);
      setPhotos(res.photos);
    } catch (err) {
      console.error('[ProfileModal] Error loading provider:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEstimate = async (duration: number) => {
    try {
      const res = await api.estimateCall(providerId, duration);
      setEstimate({
        totalAmount: res.totalAmount,
        commissionAmount: res.commissionAmount,
        providerAmount: res.providerAmount,
      });
    } catch {
      // Fallback local calc
      if (tariff) {
        let total = 0;
        if (duration === 5 && tariff.pricePer5Min > 0) total = tariff.pricePer5Min;
        else if (duration === 10 && tariff.pricePer10Min > 0) total = tariff.pricePer10Min;
        else if (duration === 15 && tariff.pricePer15Min > 0) total = tariff.pricePer15Min;
        else total = Number((tariff.pricePerMin * duration).toFixed(2));
        setEstimate({ totalAmount: total, commissionAmount: total * 0.15, providerAmount: total * 0.85 });
      }
    }
  };

  const handleSendReport = async () => {
    if (!provider) return;
    try {
      await api.reportUser(provider.id, reportReason, reportDetails);
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
        setReportDetails('');
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Error al enviar denuncia');
    }
  };

  const handleBlockUser = async () => {
    if (!provider) return;
    if (confirm(`¿Estás seguro de que deseas bloquear a ${provider.alias || provider.name}? Ya no verás su perfil ni llamadas.`)) {
      try {
        await api.blockUser(provider.id);
        alert('Usuario bloqueado con éxito.');
        onClose();
      } catch (err: any) {
        alert(err.message || 'Error al bloquear usuario');
      }
    }
  };

  if (isLoading || !provider || !tariff) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-300">Cargando escaparate de usuario...</p>
        </div>
      </div>
    );
  }

  const isOnline = provider.status === 'disponible';
  const isBusy = provider.status === 'ocupado';
  const totalCost = estimate?.totalAmount || tariff.pricePerMin * selectedDuration;
  const userBalance = user?.walletBalance || 0;
  const hasEnoughBalance = user ? userBalance >= totalCost : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 flex flex-col my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Profile Banner Header */}
        <div className="relative h-44 sm:h-56 w-full bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 overflow-hidden">
          <img
            src={photos.find(p => p.isPrimary)?.url || provider.avatar}
            alt="Banner"
            className="w-full h-full object-cover opacity-30 filter blur-sm scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        </div>

        {/* Profile Card Body */}
        <div className="px-5 sm:px-8 pb-8 -mt-16 sm:-mt-20 relative z-10 space-y-6">
          
          {/* Header Row: Avatar, Main Info & Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="relative">
                <img
                  src={provider.avatar}
                  alt={provider.name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-slate-900 border-2 border-indigo-500/50 shadow-2xl bg-slate-950"
                />
                <span
                  className={`absolute bottom-2 right-2 w-4 h-4 rounded-full ring-2 ring-slate-900 ${
                    isOnline ? 'bg-emerald-400 status-pulse-online' : isBusy ? 'bg-amber-400' : 'bg-slate-500'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-1.5">
                    {provider.alias || provider.name}
                    {provider.isVerifiedBadge && (
                      <span title="Verificado Oficial">
                        <CheckCircle2 className="w-5 h-5 text-sky-400" />
                      </span>
                    )}
                  </h2>
                </div>

                <div className="text-xs text-slate-400 mt-0.5">{provider.name}</div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {provider.city ? `${provider.city}, ${provider.country}` : provider.country}
                  </span>

                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {provider.rating.toFixed(1)} ({provider.reviewsCount} reseñas)
                  </span>

                  <span className="flex items-center gap-1 text-indigo-300">
                    <Globe className="w-3.5 h-3.5" />
                    {provider.languages.join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Availability Pill */}
            <div className="flex items-center gap-2">
              <div
                className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${
                  isOnline
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : isBusy
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : isBusy ? 'bg-amber-400' : 'bg-slate-500'}`} />
                <span>{isOnline ? 'Disponible para llamar' : isBusy ? 'En videollamada' : 'Desconectado'}</span>
              </div>
            </div>
          </div>

          {/* Bio Description */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Acerca de</h4>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {provider.bio}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {provider.categories.map((c) => (
                <span key={c} className="px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 text-xs font-medium">
                  #{c}
                </span>
              ))}
            </div>
          </div>

          {/* Photo Catalog Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Catálogo de Fotografías</span>
                <span className="text-xs font-normal text-slate-400">({photos.length} fotos)</span>
              </h3>
              <span className="text-xs text-slate-400">Toca una imagen para ampliar</span>
            </div>

            {photos.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400">
                El usuario aún no ha cargado fotos adicionales a su escaparate.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {photos.map((ph, idx) => (
                  <div
                    key={ph.id}
                    onClick={() => setLightboxIndex(idx)}
                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer bg-slate-950 border border-slate-800/80 hover:border-indigo-500/60 transition-all shadow-md"
                  >
                    <img
                      src={ph.url}
                      alt={ph.caption || 'Foto de catálogo'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {ph.isPrivate && (
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center">
                        <Lock className="w-5 h-5 text-amber-400 mb-1" />
                        <span className="text-[10px] text-amber-200 font-semibold">Exclusivo Clientes</span>
                      </div>
                    )}

                    {ph.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-2 text-[11px] text-slate-200 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {ph.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tariff Calculator & Call Booking Box */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-950 to-slate-900 border border-indigo-900/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-indigo-400" />
                  <span>Contratar Videollamada Privada</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Tarifas transparentes por tiempo. Sala encriptada punto a punto.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Tarifa base</span>
                <span className="text-xl font-extrabold text-emerald-400">
                  ${tariff.pricePerMin.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-slate-300">USD/min</span>
                </span>
              </div>
            </div>

            {/* Time Preset Selector Buttons */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Selecciona la duración deseada:
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {[
                  { mins: 5, price: tariff.pricePer5Min || tariff.pricePerMin * 5 },
                  { mins: 10, price: tariff.pricePer10Min || tariff.pricePerMin * 10 },
                  { mins: 15, price: tariff.pricePer15Min || tariff.pricePerMin * 15 },
                  { mins: 30, price: tariff.pricePerMin * 30 },
                ].map((item) => (
                  <button
                    key={item.mins}
                    onClick={() => setSelectedDuration(item.mins)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedDuration === item.mins
                        ? 'bg-indigo-600/30 border-indigo-500 shadow-md shadow-indigo-600/20 text-white'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-sm font-bold flex items-center justify-between">
                      <span>{item.mins} min</span>
                      {selectedDuration === item.mins && <span className="w-2 h-2 rounded-full bg-indigo-400" />}
                    </div>
                    <div className="text-xs font-semibold text-emerald-400 mt-1">
                      ${item.price.toFixed(2)} USD
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Pricing Summary Breakdown */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Duración seleccionada:</span>
                <span className="font-semibold text-white">{selectedDuration} minutos</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Importe total a debitar:</span>
                <span className="font-bold text-base text-emerald-400">${totalCost.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                <span>Tu saldo actual disponible:</span>
                <span className={`font-semibold ${user ? (hasEnoughBalance ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-400'}`}>
                  {user ? `$${userBalance.toFixed(2)} USD` : 'Inicia sesión para ver saldo'}
                </span>
              </div>

              {!hasEnoughBalance && user && (
                <div className="mt-2 p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Te faltan ${(totalCost - userBalance).toFixed(2)} USD para esta llamada.</span>
                  </div>
                  <button
                    onClick={onOpenWallet}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0"
                  >
                    Recargar
                  </button>
                </div>
              )}
            </div>

            {/* Big Action Call Button */}
            {!user ? (
              <button
                onClick={onOpenAuth}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                <span>Inicia Sesión para Llamar (${totalCost.toFixed(2)} USD)</span>
              </button>
            ) : hasEnoughBalance ? (
              <button
                onClick={() => onRequestCall(provider.id, selectedDuration)}
                disabled={isBusy}
                className={`w-full py-3.5 rounded-2xl font-extrabold text-sm transition-all shadow-xl flex items-center justify-center gap-2 ${
                  isBusy
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30 active:scale-[0.99]'
                }`}
              >
                <Video className="w-5 h-5" />
                <span>{isBusy ? 'Prestador Ocupado en este Momento' : `Llamar Ahora (${selectedDuration} min por $${totalCost.toFixed(2)} USD)`}</span>
              </button>
            ) : (
              <button
                onClick={onOpenWallet}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 text-white font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                <span>Recargar Saldo en Billetera</span>
              </button>
            )}
          </div>

          {/* Safety & Moderation Footer */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowReportModal(true)}
                className="hover:text-rose-400 transition-colors flex items-center gap-1"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Denunciar perfil</span>
              </button>

              <button
                onClick={handleBlockUser}
                className="hover:text-slate-300 transition-colors"
              >
                Bloquear usuario
              </button>
            </div>

            <div className="text-[11px] text-slate-500">
              ID: {provider.id}
            </div>
          </div>
        </div>

        {/* Lightbox Modal */}
        {lightboxIndex !== null && photos[lightboxIndex] && (
          <div className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4">
            <div className="w-full flex items-center justify-between text-white text-xs max-w-4xl pt-2">
              <span>
                {lightboxIndex + 1} de {photos.length}
              </span>
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative flex items-center justify-center max-w-4xl max-h-[75vh] w-full my-auto">
              <img
                src={photos[lightboxIndex].url}
                alt="Foto ampliada"
                className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />

              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length)}
                    className="absolute left-2 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setLightboxIndex((lightboxIndex + 1) % photos.length)}
                    className="absolute right-2 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            <div className="text-center text-slate-300 text-sm pb-4 max-w-xl">
              {photos[lightboxIndex].caption || 'Fotografía del escaparate'}
            </div>
          </div>
        )}

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-rose-400 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  <span>Denunciar a {provider.alias || provider.name}</span>
                </h3>
                <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {reportSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs text-center">
                  Denuncia recibida. El equipo de SuperAdmin revisará este perfil de inmediato.
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Motivo principal</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                    >
                      <option value="Comportamiento inapropiado">Comportamiento inapropiado</option>
                      <option value="Fotografía no autorizada o explícita">Fotografía no autorizada o explícita</option>
                      <option value="Suplantación de identidad">Suplantación de identidad</option>
                      <option value="Cobro fuera de la plataforma">Intento de cobro fuera de plataforma</option>
                      <option value="Incumplimiento de horario">Incumplimiento reiterado de llamadas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Detalles de lo sucedido</label>
                    <textarea
                      rows={3}
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Explica qué ocurrió para que los moderadores puedan tomar medidas inmediatas..."
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSendReport}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                    >
                      Enviar Denuncia
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
