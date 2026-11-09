import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Photo, Tariff, CallRequest } from '../types';
import {
  User as UserIcon,
  Camera,
  Image,
  DollarSign,
  Clock,
  CheckCircle2,
  Lock,
  Unlock,
  Trash2,
  Star,
  ArrowUp,
  ArrowDown,
  Upload,
  Plus,
  Video,
  Shield,
  Save,
  Globe,
  Sliders,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { UserMetricsDashboard } from './UserMetricsDashboard';

interface UserDashboardProps {
  onOpenWallet: () => void;
  onNavigateHome: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onOpenWallet, onNavigateHome }) => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'metrics' | 'profile' | 'catalog' | 'tariffs' | 'calls'>('metrics');

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [alias, setAlias] = useState(user?.alias || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [country, setCountry] = useState(user?.country || 'España');
  const [city, setCity] = useState(user?.city || '');
  const [status, setStatus] = useState<'disponible' | 'ocupado' | 'desconectado'>(user?.status || 'disponible');
  const [languages, setLanguages] = useState<string>(user?.languages?.join(', ') || 'Español');
  const [categories, setCategories] = useState<string[]>(user?.categories || []);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Photos State
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoIsPrivate, setNewPhotoIsPrivate] = useState(false);

  // Tariffs State
  const [tariff, setTariff] = useState<Tariff | null>(null);
  const [pricePerMin, setPricePerMin] = useState<number>(2.0);
  const [pricePer5Min, setPricePer5Min] = useState<number>(9.5);
  const [pricePer10Min, setPricePer10Min] = useState<number>(18.0);
  const [pricePer15Min, setPricePer15Min] = useState<number>(25.0);
  const [minMinutes, setMinMinutes] = useState<number>(5);
  const [maxMinutes, setMaxMinutes] = useState<number>(60);
  const [autoAccept, setAutoAccept] = useState<boolean>(true);
  const [callsEnabled, setCallsEnabled] = useState<boolean>(true);
  const [isSavingTariffs, setIsSavingTariffs] = useState(false);
  const [tariffsMsg, setTariffsMsg] = useState<string | null>(null);

  // Calls History State
  const [calls, setCalls] = useState<CallRequest[]>([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);

  useEffect(() => {
    loadCategories();
    if (user) {
      loadPhotos();
      loadTariffs();
      loadCalls();
    }
  }, [user]);

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      setAllCategories(res.categories);
    } catch {
      // ignore
    }
  };

  const loadPhotos = async () => {
    try {
      const res = await api.getUserPhotos();
      setPhotos(res.photos);
    } catch {
      // ignore
    }
  };

  const loadTariffs = async () => {
    try {
      const res = await api.getTariffs();
      setTariff(res.tariff);
      setPricePerMin(res.tariff.pricePerMin);
      setPricePer5Min(res.tariff.pricePer5Min);
      setPricePer10Min(res.tariff.pricePer10Min);
      setPricePer15Min(res.tariff.pricePer15Min);
      setMinMinutes(res.tariff.minMinutes);
      setMaxMinutes(res.tariff.maxMinutes);
      setAutoAccept(res.tariff.autoAccept);
      setCallsEnabled(res.tariff.callsEnabled);
    } catch {
      // ignore
    }
  };

  const loadCalls = async () => {
    setIsLoadingCalls(true);
    try {
      const res = await api.getCallHistory();
      setCalls(res.calls);
    } catch {
      // ignore
    } finally {
      setIsLoadingCalls(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg(null);
    try {
      const langArray = languages.split(',').map(l => l.trim()).filter(Boolean);
      await api.updateProfile({
        name,
        alias,
        bio,
        country,
        city,
        status,
        languages: langArray,
        categories,
      });
      await refreshUser();
      setProfileMsg('¡Escaparate actualizado con éxito!');
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err: any) {
      setProfileMsg(err.message || 'Error al guardar');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Image upload with canvas optimization to reduce weight
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new window.Image();
        img.onload = async () => {
          // Optimize dimensions to max 1280px width/height
          const maxDim = 1280;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.85);

            await api.addPhoto({
              url: optimizedBase64,
              caption: newPhotoCaption || file.name.replace(/\.[^/.]+$/, ''),
              isPrivate: newPhotoIsPrivate,
            });

            setNewPhotoCaption('');
            setNewPhotoIsPrivate(false);
            await loadPhotos();
            await refreshUser();
          }
          setIsUploadingPhoto(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert(err.message || 'Error al procesar la imagen');
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveTariffs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTariffs(true);
    setTariffsMsg(null);
    try {
      await api.updateTariffs({
        pricePerMin,
        pricePer5Min,
        pricePer10Min,
        pricePer15Min,
        minMinutes,
        maxMinutes,
        autoAccept,
        callsEnabled,
      });
      setTariffsMsg('¡Tarifas y condiciones actualizadas correctamente!');
      setTimeout(() => setTariffsMsg(null), 3000);
    } catch (err: any) {
      setTariffsMsg(err.message || 'Error al guardar tarifas');
    } finally {
      setIsSavingTariffs(false);
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    try {
      await api.setPrimaryPhoto(photoId);
      await loadPhotos();
      await refreshUser();
    } catch {
      // ignore
    }
  };

  const handleTogglePrivacy = async (photoId: string, currentPrivate: boolean) => {
    try {
      await api.togglePhotoPrivacy(photoId, !currentPrivate);
      await loadPhotos();
    } catch {
      // ignore
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (confirm('¿Eliminar esta fotografía de tu escaparate?')) {
      try {
        await api.deletePhoto(photoId);
        await loadPhotos();
        await refreshUser();
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 space-y-6">
      
      {/* Dashboard Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar}
            alt={user?.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                {user?.alias || user?.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 capitalize">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Administración de tu escaparate, catálogo y tarifas de videollamadas
            </p>
          </div>
        </div>

        {/* Quick Wallet CTA */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenWallet}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors border border-slate-700/60"
          >
            <span>Saldo: ${user?.walletBalance.toFixed(2)} USD</span>
          </button>
          <button
            onClick={onNavigateHome}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors"
          >
            Ver en Góndola
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'metrics'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 font-bold'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span>Rendimiento & Métricas</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'profile'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Mi Escaparate</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'catalog'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>Catálogo de Fotos ({photos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tariffs')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'tariffs'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Tarifas de Videollamadas</span>
        </button>

        <button
          onClick={() => setActiveTab('calls')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'calls'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Historial de Sesiones ({calls.length})</span>
        </button>
      </div>

      {/* TAB 0: RENDIMIENTO & MÉTRICAS (RECHARTS) */}
      {activeTab === 'metrics' && (
        <UserMetricsDashboard calls={calls} user={user} onOpenWallet={onOpenWallet} />
      )}

      {/* TAB 1: MI ESCAPARATE / PERFIL */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {profileMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{profileMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column: Public Identity */}
            <div className="md:col-span-2 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-indigo-400" />
                <span>Datos Públicos del Escaparate</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nombre Público / Alias</label>
                  <input
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-slate-400 font-semibold mb-1">Descripción / Bio del Perfil</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe tu experiencia, qué ofreces en tus videollamadas y por qué los usuarios deberían contactarte..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">País</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Ciudad (Opcional)</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Idiomas (separados por coma)</label>
                  <input
                    type="text"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="text-xs">
                <label className="block text-slate-400 font-semibold mb-2">Categorías / Especialidades</label>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((cat) => {
                    const isSelected = categories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => {
                          if (isSelected) setCategories(categories.filter(c => c !== cat));
                          else setCategories([...categories, cat]);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Availability Status */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 text-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Estado de Disponibilidad</span>
              </h3>

              <div className="space-y-2">
                {[
                  {
                    id: 'disponible',
                    label: 'Disponible (Online)',
                    desc: 'Listo para recibir solicitudes de videollamada de inmediato.',
                    color: 'emerald',
                  },
                  {
                    id: 'ocupado',
                    label: 'Ocupado en Llamada',
                    desc: 'Muestra que estás en una sesión activa.',
                    color: 'amber',
                  },
                  {
                    id: 'desconectado',
                    label: 'Desconectado',
                    desc: 'No recibirás llamadas hasta que vuelvas a conectarte.',
                    color: 'slate',
                  },
                ].map((s) => (
                  <label
                    key={s.id}
                    onClick={() => setStatus(s.id as any)}
                    className={`block p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      status === s.id
                        ? 'bg-slate-950 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="availability_status"
                        checked={status === s.id}
                        onChange={() => setStatus(s.id as any)}
                        className="accent-indigo-500"
                      />
                      <span className="font-bold text-white">{s.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 pl-5">{s.desc}</p>
                  </label>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? 'Guardando...' : 'Guardar Cambios de Escaparate'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: CATÁLOGO DE FOTOGRAFÍAS */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Uploader Box */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-400" />
              <span>Subir Nueva Fotografía al Catálogo</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Descripción o Pie de Foto</label>
                <input
                  type="text"
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  placeholder="Ej: Sesión en vivo de asesoramiento..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer w-full text-slate-300">
                  <input
                    type="checkbox"
                    checked={newPhotoIsPrivate}
                    onChange={(e) => setNewPhotoIsPrivate(e.target.checked)}
                    className="accent-indigo-500 rounded"
                  />
                  <span>Contenido Privado (Solo clientes)</span>
                </label>
              </div>
            </div>

            {/* File Picker & Optimizer */}
            <div className="flex items-center gap-4">
              <label className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer transition-all shadow-md flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>{isUploadingPhoto ? 'Optimizando imagen...' : 'Seleccionar Imagen desde PC o Celular'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-400">
                Se optimiza automáticamente para no perder nitidez y cargar a máxima velocidad.
              </span>
            </div>
          </div>

          {/* Existing Photos Grid */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
              Tus Fotografías Publicadas ({photos.length})
            </h3>

            {photos.length === 0 ? (
              <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                Aún no has agregado fotos a tu catálogo. Selecciona una arriba para comenzar.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((ph) => (
                  <div
                    key={ph.id}
                    className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md flex flex-col"
                  >
                    <div className="relative aspect-[3/4] w-full bg-slate-950">
                      <img src={ph.url} alt={ph.caption} className="w-full h-full object-cover" />

                      {ph.isPrimary && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow">
                          Foto Principal
                        </div>
                      )}

                      {ph.isPrivate && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500/90 text-slate-950 text-[10px] font-extrabold shadow flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Privada</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 text-xs flex-1 flex flex-col justify-between space-y-2">
                      <div className="text-slate-200 line-clamp-1 font-medium">
                        {ph.caption || 'Sin descripción'}
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-800/80">
                        {!ph.isPrimary && (
                          <button
                            onClick={() => handleSetPrimary(ph.id)}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                          >
                            Hacer Principal
                          </button>
                        )}

                        <button
                          onClick={() => handleTogglePrivacy(ph.id, ph.isPrivate)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                          title={ph.isPrivate ? 'Hacer pública' : 'Hacer privada'}
                        >
                          {ph.isPrivate ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => handleDeletePhoto(ph.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-950/50 text-slate-400 hover:text-rose-400"
                          title="Eliminar foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TARIFAS DE VIDEOLLAMADAS */}
      {activeTab === 'tariffs' && (
        <form onSubmit={handleSaveTariffs} className="space-y-6">
          {tariffsMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{tariffsMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Price configuration */}
            <div className="md:col-span-2 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Precios y Paquetes de Tiempo (USD)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Precio por Minuto Base</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.10"
                      min="1.0"
                      max="50.0"
                      value={pricePerMin}
                      onChange={(e) => setPricePerMin(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Precio Paquete 5 Minutos</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.50"
                      value={pricePer5Min}
                      onChange={(e) => setPricePer5Min(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Precio Paquete 10 Minutos</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.50"
                      value={pricePer10Min}
                      onChange={(e) => setPricePer10Min(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Precio Paquete 15 Minutos</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.50"
                      value={pricePer15Min}
                      onChange={(e) => setPricePer15Min(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Duración Mínima (Minutos)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={minMinutes}
                    onChange={(e) => setMinMinutes(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Duración Máxima (Minutos)</label>
                  <input
                    type="number"
                    min="15"
                    max="120"
                    value={maxMinutes}
                    onChange={(e) => setMaxMinutes(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Conditions & Switches */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 text-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Condiciones de Aceptación</span>
              </h3>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={callsEnabled}
                    onChange={(e) => setCallsEnabled(e.target.checked)}
                    className="accent-emerald-500 mt-0.5 rounded"
                  />
                  <div>
                    <span className="font-bold text-white block">Habilitar Videollamadas</span>
                    <span className="text-[11px] text-slate-400">
                      Permite que los clientes vean el botón para contratarte.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoAccept}
                    onChange={(e) => setAutoAccept(e.target.checked)}
                    className="accent-indigo-500 mt-0.5 rounded"
                  />
                  <div>
                    <span className="font-bold text-white block">Aceptación Automática</span>
                    <span className="text-[11px] text-slate-400">
                      Entra directamente a la sala cuando un cliente reserva con saldo disponible.
                    </span>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSavingTariffs}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingTariffs ? 'Guardando...' : 'Guardar Tarifas'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: HISTORIAL DE VIDEOLLAMADAS */}
      {activeTab === 'calls' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Video className="w-4 h-4 text-indigo-400" />
            <span>Registro Completo de Videollamadas Realizadas</span>
          </h3>

          {isLoadingCalls ? (
            <div className="text-center py-10 text-xs text-slate-400">Cargando sesiones...</div>
          ) : calls.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No tienes llamadas registradas en tu historial.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {calls.map((c) => {
                const isProviderOfCall = user?.id === c.providerId;
                const otherPartyName = isProviderOfCall ? c.clientName : c.providerName;
                const otherPartyAvatar = isProviderOfCall ? c.clientAvatar : c.providerAvatar;

                return (
                  <div key={c.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={otherPartyAvatar}
                        alt={otherPartyName}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700"
                      />
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{otherPartyName}</span>
                          <span
                            className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                              c.status === 'completed'
                                ? 'bg-emerald-950 text-emerald-300'
                                : c.status === 'in_progress'
                                ? 'bg-indigo-950 text-indigo-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {c.durationMinutes} min contratados •{' '}
                          {new Date(c.createdAt).toLocaleDateString([], {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-emerald-400">
                        {isProviderOfCall ? `+$${c.providerAmount.toFixed(2)}` : `-$${c.totalAmount.toFixed(2)}`} USD
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Consumo: {Math.round(c.actualSecondsUsed / 60)} min
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
