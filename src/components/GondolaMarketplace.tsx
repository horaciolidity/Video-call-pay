import React, { useState, useEffect, useRef } from 'react';
import { EnrichedProvider } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CountryFilterModal } from './CountryFilterModal';
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
  ChevronLeft,
  Shield,
  Zap,
  Globe,
  Compass,
  ArrowLeftRight,
  Grid,
  Heart
} from 'lucide-react';

interface GondolaMarketplaceProps {
  onSelectProvider: (provider: EnrichedProvider) => void;
  onDirectCall: (provider: EnrichedProvider) => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  onStartTour?: () => void;
}

export const GondolaMarketplace: React.FC<GondolaMarketplaceProps> = ({
  onSelectProvider,
  onDirectCall,
  searchTerm,
  setSearchTerm,
  onStartTour,
}) => {
  const { user } = useAuth();
  const [providers, setProviders] = useState<EnrichedProvider[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(50);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState<boolean>(false);

  // Lateral Slider & Country Modal State
  const [displayMode, setDisplayMode] = useState<'slider' | 'grid'>('slider');
  const [isCountryModalOpen, setIsCountryModalOpen] = useState<boolean>(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [selectedCategory, selectedStatus, selectedCountry, sortBy, maxPriceFilter, searchTerm, user]);

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

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  const onlineCount = providers.filter(p => p.status === 'disponible').length;
  const activeExclusionCount =
    (user?.excludedCountriesFromSeeingMe?.length || 0) + (user?.excludedCountriesToSee?.length || 0);

  return (
    <div className="pb-24 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-5">
      
      {/* Streamlined Explorer Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <span>Góndola Love Call</span>
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{onlineCount} en vivo</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Desliza a los lados para explorar perfiles y conectar por videollamada privada
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Country Privacy & Visibility Settings Trigger */}
          <button
            type="button"
            onClick={() => setIsCountryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-colors shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-rose-400" />
            <span>Países & Filtros</span>
            {activeExclusionCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-extrabold border border-rose-500/30">
                {activeExclusionCount}
              </span>
            )}
          </button>

          {onStartTour && (
            <button
              type="button"
              onClick={onStartTour}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold transition-colors shrink-0"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tour</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Search & Filter Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, especialidad, alias o tema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all shadow-inner"
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
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl border text-xs font-semibold transition-all shadow-sm ${
              showFiltersDrawer
                ? 'bg-rose-600 border-rose-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {(selectedStatus !== 'all' || selectedCountry !== 'all' || maxPriceFilter < 50) && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          >
            <option value="featured">✨ Destacados</option>
            <option value="rating">⭐ Mejor valoración</option>
            <option value="price_asc">💵 Precio: Menor</option>
            <option value="price_desc">💎 Precio: Mayor</option>
          </select>

          {/* Display Mode Switcher (Lateral Slider vs Grid) */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setDisplayMode('slider')}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
                displayMode === 'slider'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Ver perfiles deslizables a los laterales"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Deslizar ↔</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('grid')}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
                displayMode === 'grid'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Ver cuadrícula"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cuadrícula</span>
            </button>
          </div>
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
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-slate-400">País o Ubicación</label>
                <button
                  type="button"
                  onClick={() => setIsCountryModalOpen(true)}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  Excluir / Gestionar
                </button>
              </div>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
              >
                <option value="all">Todos los países permitidos</option>
                <option value="España">🇪🇸 España</option>
                <option value="Estados Unidos">🇺🇸 Estados Unidos</option>
                <option value="Argentina">🇦🇷 Argentina</option>
                <option value="México">🇲🇽 México</option>
                <option value="Italia">🇮🇹 Italia</option>
                <option value="Reino Unido">🇬🇧 Reino Unido</option>
                <option value="Colombia">🇨🇴 Colombia</option>
                <option value="Chile">🇨🇱 Chile</option>
              </select>
            </div>

            {/* Max Price Range Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-slate-400">Tarifa máxima por minuto</label>
                <span className="font-bold text-rose-400">${maxPriceFilter} USD/min</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Horizontal Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lateral Sliding Navigation Bar (Visible in Slider Mode) */}
      {displayMode === 'slider' && !isLoading && providers.length > 0 && (
        <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-rose-400" />
              <span>Desliza lateralmente</span>
            </span>
            <span>• {providers.length} perfiles disponibles</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={scrollLeft}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors shadow-sm"
              title="Deslizar hacia la izquierda"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors shadow-sm"
              title="Deslizar hacia la derecha"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Providers Presentation (Slider Mode or Grid Mode) */}
      {isLoading ? (
        <div className="flex gap-5 overflow-x-auto pb-6 pt-2 scrollbar-none">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-[300px] shrink-0 rounded-3xl bg-slate-900/50 border border-slate-800/60 p-4 space-y-4 animate-pulse">
              <div className="aspect-[4/5] rounded-2xl bg-slate-800" />
              <div className="h-4 bg-slate-800 rounded w-2/3" />
              <div className="h-3 bg-slate-800 rounded w-full" />
              <div className="h-10 bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-slate-800/60 p-8 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 text-2xl">
            🔍
          </div>
          <h3 className="text-lg font-bold text-white">No encontramos prestadores con estos filtros</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Prueba ajustando el término de búsqueda, tus exclusiones de países o cambiando la categoría.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('Todos');
                setSelectedStatus('all');
                setSelectedCountry('all');
                setMaxPriceFilter(50);
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition-colors"
            >
              Restablecer Filtros
            </button>
            <button
              onClick={() => setIsCountryModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-rose-400" />
              <span>Configurar Países</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={sliderRef}
          className={
            displayMode === 'slider'
              ? 'flex gap-5 overflow-x-auto pb-6 pt-2 scroll-smooth snap-x snap-mandatory scrollbar-none touch-pan-x'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          }
        >
          {providers.map((p) => {
            const isOnline = p.status === 'disponible';
            const isBusy = p.status === 'ocupado';

            return (
              <div
                key={p.id}
                className={`group relative rounded-3xl overflow-hidden bg-slate-900/90 border border-slate-800/90 hover:border-rose-500/50 hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-300 flex flex-col ${
                  displayMode === 'slider' ? 'w-[290px] sm:w-[320px] shrink-0 snap-start shadow-xl' : 'shadow-xl'
                }`}
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
                        <div className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[10px] font-extrabold flex items-center gap-1 backdrop-blur-md">
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
                    <div className="px-3 py-1.5 rounded-2xl bg-slate-950/90 border border-rose-500/40 text-white backdrop-blur-md shadow-lg text-right">
                      <div className="text-[10px] text-rose-300 font-medium uppercase tracking-wider">Desde</div>
                      <div className="font-extrabold text-sm sm:text-base leading-none text-emerald-400 font-mono">
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
                        className="font-bold text-base text-white hover:text-rose-400 cursor-pointer transition-colors flex items-center gap-1.5 truncate"
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
                        <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
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
                      <Eye className="w-3.5 h-3.5 text-rose-400" />
                      <span>Ver Perfil</span>
                    </button>

                    <button
                      onClick={() => onDirectCall(p)}
                      disabled={isBusy}
                      className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md ${
                        isBusy
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-600/25 active:scale-95'
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

      {/* Country Filter & Visibility Settings Modal */}
      <CountryFilterModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        onSaved={fetchProviders}
      />
    </div>
  );
};
