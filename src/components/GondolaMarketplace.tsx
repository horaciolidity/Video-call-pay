import React, { useState, useEffect } from 'react';
import { EnrichedProvider } from '../types';
import { api } from '../services/api';
import {
  Search,
  Filter,
  CheckCircle2,
  Star,
  Video,
  Eye,
  Sparkles,
  MapPin,
  Clock,
  SlidersHorizontal,
  ChevronRight,
  Shield,
  Zap,
  Globe
} from 'lucide-react';

interface GondolaMarketplaceProps {
  onSelectProvider: (provider: EnrichedProvider) => void;
  onDirectCall: (provider: EnrichedProvider) => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
}

export const GondolaMarketplace: React.FC<GondolaMarketplaceProps> = ({
  onSelectProvider,
  onDirectCall,
  searchTerm,
  setSearchTerm,
}) => {
  const [providers, setProviders] = useState<EnrichedProvider[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(50);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState<boolean>(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [selectedCategory, selectedStatus, selectedCountry, sortBy, maxPriceFilter, searchTerm]);

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      setCategories(['Todos', ...res.categories]);
    } catch {
      // ignore
    }
  };

  const fetchProviders = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory && selectedCategory !== 'Todos') params.category = selectedCategory;
      if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedCountry && selectedCountry !== 'all') params.country = selectedCountry;
      if (sortBy) params.sortBy = sortBy;
      if (maxPriceFilter < 50) params.maxPrice = maxPriceFilter.toString();

      const res = await api.getProviders(params);
      setProviders(res.providers);
    } catch (err) {
      console.error('[Marketplace] Error fetching providers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onlineCount = providers.filter(p => p.status === 'disponible').length;

  return (
    <div className="pb-24 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      
      {/* Visual Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-slate-800/80 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-72 h-72 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Góndola de Usuarios Verificados</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-400 font-bold">{onlineCount} disponibles ahora</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Descubre perfiles excepcionales y conecta por{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-rose-400">
              videollamada privada
            </span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Explora catálogos de imágenes en alta resolución, consulta tarifas transparentes por minuto y realiza sesiones 1 a 1 con total privacidad y cobro fraccionado seguro.
          </p>

          {/* Quick Metrics Strip */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Conexión WebRTC de baja latencia</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Garantía de saldo antifraude</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Tarifas fijadas por cada prestador</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Search & Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, especialidad, alias o tema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Quick Filter Drawer Toggle */}
          <button
            onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-semibold transition-all shadow-sm ${
              showFiltersDrawer
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtros Avanzados</span>
            {(selectedStatus !== 'all' || selectedCountry !== 'all' || maxPriceFilter < 50) && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="featured">✨ Destacados primero</option>
            <option value="rating">⭐ Mejor valoración</option>
            <option value="price_asc">💵 Precio: Menor a Mayor</option>
            <option value="price_desc">💎 Precio: Mayor a Menor</option>
          </select>
        </div>

        {/* Collapsible Filters Drawer */}
        {showFiltersDrawer && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-in fade-in duration-150">
            {/* Status filter */}
            <div>
              <label className="block font-semibold text-slate-400 mb-1.5">Estado en Tiempo Real</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
              >
                <option value="all">Cualquier estado</option>
                <option value="disponible">🟢 Solo Disponibles (Online)</option>
                <option value="ocupado">🟠 Ocupados en llamada</option>
                <option value="desconectado">⚪ Desconectados</option>
              </select>
            </div>

            {/* Country filter */}
            <div>
              <label className="block font-semibold text-slate-400 mb-1.5">País o Ubicación</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
              >
                <option value="all">Todos los países</option>
                <option value="España">España</option>
                <option value="Estados Unidos">Estados Unidos</option>
                <option value="Argentina">Argentina</option>
                <option value="México">México</option>
                <option value="Italia">Italia</option>
                <option value="Reino Unido">Reino Unido</option>
                <option value="Colombia">Colombia</option>
                <option value="Chile">Chile</option>
              </select>
            </div>

            {/* Max Price Range Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-slate-400">Tarifa máxima por minuto</label>
                <span className="font-bold text-indigo-400">${maxPriceFilter} USD/min</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Horizontal Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Gondola Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-3xl bg-slate-900/50 border border-slate-800/60 p-4 space-y-4 animate-pulse">
              <div className="aspect-[4/5] rounded-2xl bg-slate-800" />
              <div className="h-4 bg-slate-800 rounded w-2/3" />
              <div className="h-3 bg-slate-800 rounded w-full" />
              <div className="h-10 bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800/60 p-8 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 text-2xl">
            🔍
          </div>
          <h3 className="text-lg font-bold text-white">No encontramos prestadores con estos filtros</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Prueba ajustando el término de búsqueda, ampliando el rango de tarifas o cambiando la categoría.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('Todos');
              setSelectedStatus('all');
              setSelectedCountry('all');
              setMaxPriceFilter(50);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors"
          >
            Restablecer Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {providers.map((p) => {
            const isOnline = p.status === 'disponible';
            const isBusy = p.status === 'ocupado';

            return (
              <div
                key={p.id}
                className="group relative rounded-3xl overflow-hidden bg-slate-900/80 border border-slate-800/90 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col"
              >
                {/* Image Showcase Container */}
                <div
                  onClick={() => onSelectProvider(p)}
                  className="relative aspect-[4/5] w-full overflow-hidden cursor-pointer bg-slate-950"
                >
                  <img
                    src={p.primaryPhotoUrl || p.avatar}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  
                  {/* Subtle Gradient Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Top Bar inside Card: Status Badge & Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                    {/* Live Status Pill */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-md ${
                        isOnline
                          ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                          : isBusy
                          ? 'bg-amber-950/80 border border-amber-500/50 text-amber-300'
                          : 'bg-slate-900/80 border border-slate-700/60 text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isOnline
                            ? 'bg-emerald-400 status-pulse-online'
                            : isBusy
                            ? 'bg-amber-400 status-pulse-busy'
                            : 'bg-slate-500'
                        }`}
                      />
                      <span>{isOnline ? 'Disponible' : isBusy ? 'En llamada' : 'Desconectado'}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {p.isFeatured && (
                        <div className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-extrabold flex items-center gap-1 backdrop-blur-md">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Destacado</span>
                        </div>
                      )}

                      {p.publicPhotosCount > 1 && (
                        <div className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 text-[10px] font-medium backdrop-blur-md">
                          📸 {p.publicPhotosCount}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Floating Price Tag at Bottom of Photo */}
                  <div className="absolute bottom-3 right-3 pointer-events-none">
                    <div className="px-3 py-1.5 rounded-2xl bg-indigo-950/90 border border-indigo-500/40 text-white backdrop-blur-md shadow-lg text-right">
                      <div className="text-[10px] text-indigo-300 font-medium uppercase tracking-wider">Desde</div>
                      <div className="font-extrabold text-sm sm:text-base leading-none text-emerald-400">
                        ${p.tariff?.pricePerMin?.toFixed(2)}
                        <span className="text-[10px] font-normal text-slate-300 ml-0.5">/min</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating & Country Pill */}
                  <div className="absolute bottom-3 left-3 pointer-events-none flex flex-col gap-1">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-amber-400 text-xs font-bold backdrop-blur-md">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{p.rating?.toFixed(1) || '5.0'}</span>
                      <span className="text-slate-400 text-[10px] font-normal">({p.reviewsCount || 0})</span>
                    </div>
                  </div>
                </div>

                {/* Card Content & Info */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <h3
                        onClick={() => onSelectProvider(p)}
                        className="font-bold text-base text-white hover:text-indigo-400 cursor-pointer transition-colors flex items-center gap-1.5 truncate"
                      >
                        <span>{p.alias || p.name}</span>
                        {p.isVerifiedBadge && (
                          <span title="Perfil Verificado">
                            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                          </span>
                        )}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {p.city ? `${p.city}, ${p.country}` : p.country}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {p.bio}
                    </p>

                    {/* Category Tags */}
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {p.categories.slice(0, 2).map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 rounded-lg bg-slate-800/90 text-slate-300 text-[10px] font-medium border border-slate-700/50"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onSelectProvider(p)}
                      className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Ver Catálogo</span>
                    </button>

                    <button
                      onClick={() => onDirectCall(p)}
                      disabled={isBusy}
                      className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md ${
                        isBusy
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 active:scale-95'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{isBusy ? 'En llamada' : 'Llamar'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
