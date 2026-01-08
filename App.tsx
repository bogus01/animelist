import React, { useState, useEffect, useMemo } from 'react';
import { Search, Info, Bookmark, Trash2, Plus, ChevronLeft, ChevronRight, Play, CheckCircle, Clock, X, Heart, ExternalLink, Calendar, Check, Layers, ArrowLeft, Star } from 'lucide-react';
import { Anime, WatchStatus, UserData, StreamingEpisode, NextAiringEpisode } from './types';
import { searchAnime, getAnimeById, getAnimeListByIds, getTrendingAnime, getAnimeByCategory } from './services/aniListService';
import { KVStorageService } from './services/kvStorageService';

const NavButton: React.FC<{ icon: React.ReactNode, active: boolean, onClick: () => void, label: string }> = ({ icon, active, onClick, label }) => (
  <button onClick={onClick} className={`p-2 rounded-lg transition-all relative group ${active ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}>
    {icon}
    <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">{label}</span>
  </button>
);

const AnimeCard: React.FC<{
  anime: Anime,
  onClick: () => void,
  onToggleFavorite: (id: number) => void,
  isFavorite: boolean
}> = ({ anime, onClick, onToggleFavorite, isFavorite }) => {
  const seasons = useMemo(() => {
    if (!anime.relations?.edges) return '1 Saison';
    const seasonsCount = anime.relations.edges.filter(e =>
      e.node.type === 'ANIME' && (e.relationType === 'PREQUEL' || e.relationType === 'SEQUEL')
    ).length + 1;
    return `${seasonsCount} Saison${seasonsCount > 1 ? 's' : ''}`;
  }, [anime]);

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-56 h-[340px] group cursor-pointer relative"
    >
      {/* Front Side */}
      <div className="absolute inset-0 ring-1 ring-white/10 rounded-2xl overflow-hidden shadow-2xl transition-opacity duration-300 group-hover:opacity-0">
        <img src={anime.coverImage.large} className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 flex flex-col justify-end">
          <h3 className="text-sm font-bold text-white line-clamp-2 mb-2">{anime.title.english || anime.title.romaji}</h3>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">{anime.genres?.[0] || 'Anime'}</span>
            <span className="text-[10px] text-green-500 font-black">{anime.averageScore || '??'}%</span>
          </div>
        </div>
      </div>

      {/* Back Side (Details on Hover) */}
      <div className="absolute inset-0 bg-[#1a1d24] rounded-2xl p-5 border border-indigo-500/30 flex flex-col shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100 overflow-hidden">
        <div className="flex-1 space-y-3 overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-xs font-black text-white line-clamp-2 uppercase tracking-wide leading-tight">{anime.title.english || anime.title.romaji}</h4>
            <div className={`p-1.5 rounded-full ${isFavorite ? 'text-red-500 bg-red-500/10' : 'text-gray-500'}`}>
              <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[8px] font-black rounded uppercase tracking-tighter">{seasons}</span>
            <span className="px-2 py-0.5 bg-white/5 text-gray-300 text-[8px] font-black rounded uppercase tracking-tighter">{anime.episodes || '??'} Éps</span>
          </div>

          <div
            className="text-[10px] text-gray-400 leading-relaxed line-clamp-[9] font-medium"
            dangerouslySetInnerHTML={{ __html: anime.description || 'Aucune description disponible.' }}
          />
        </div>

        <div className="mt-4 pt-4 border-t border-white/5">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(anime.id); }}
            className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn shadow-lg ${isFavorite ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-indigo-500 hover:text-white'}`}
          >
            {isFavorite ? <Check size={14} /> : <Plus size={14} />}
            {isFavorite ? 'Dans ma liste' : 'Ajouter à ma liste'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AnimeCarousel: React.FC<{
  title: string,
  items: Anime[],
  onDetails: (id: number) => void,
  onToggleFavorite: (id: number) => void,
  favoriteIds: number[]
}> = ({ title, items, onDetails, onToggleFavorite, favoriteIds }) => {
  const [scrollIndex, setScrollIndex] = useState(0);
  const itemsPerPage = 5;

  const next = () => {
    if (scrollIndex + itemsPerPage < items.length) {
      setScrollIndex(prev => prev + itemsPerPage);
    }
  };

  const prev = () => {
    if (scrollIndex - itemsPerPage >= 0) {
      setScrollIndex(prev => prev - itemsPerPage);
    }
  };

  return (
    <section className="space-y-6 relative group/carousel">
      <div className="flex items-center justify-between px-8 md:px-16">
        <h2 className="text-3xl font-black text-white px-6 border-l-8 border-indigo-600 tracking-tighter uppercase">{title}</h2>
        <div className="flex gap-3 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300">
          <button
            onClick={prev}
            disabled={scrollIndex === 0}
            className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center disabled:opacity-20 disabled:bg-gray-800 disabled:cursor-not-allowed hover:scale-110 active:scale-95 transition-all shadow-xl"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={next}
            disabled={scrollIndex + itemsPerPage >= items.length}
            className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center disabled:opacity-20 disabled:bg-gray-800 disabled:cursor-not-allowed hover:scale-110 active:scale-95 transition-all shadow-xl"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      </div>
      <div className="overflow-visible px-8 md:px-16">
        <div
          className="flex gap-8 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ transform: `translateX(-${scrollIndex * (224 + 32)}px)` }}
        >
          {items.map(anime => (
            <AnimeCard
              key={anime.id}
              anime={anime}
              onClick={() => onDetails(anime.id)}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favoriteIds.includes(anime.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const AnimeDetailsView: React.FC<{
  id: number,
  onBack: () => void,
  userData: UserData,
  onStatusChange: (aid: number, s: WatchStatus) => void,
  onToggleFavorite: (id: number) => void,
  onToggleEpisode: (aid: number, ep: number) => void
}> = ({ id, onBack, userData, onStatusChange, onToggleFavorite, onToggleEpisode }) => {
  const [currentMedia, setCurrentMedia] = useState<Anime | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMedia = async () => {
      setIsLoading(true);
      const data = await getAnimeById(id);
      setCurrentMedia(data);
      setIsLoading(false);
    };
    loadMedia();
  }, [id]);

  if (isLoading || !currentMedia) return <div className="flex items-center justify-center h-96"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const currentStatus = userData.animeStatuses[currentMedia.id] || WatchStatus.PLAN_TO_WATCH;
  const isFavorite = userData.favoriteIds.includes(currentMedia.id);
  const watchedEps = userData.watchedEpisodes[currentMedia.id] || [];

  return (
    <div className="animate-in fade-in duration-500 p-8 pt-0">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8">
        <ArrowLeft size={20} /> Retour
      </button>

      <div className="grid lg:grid-cols-[300px_1fr] gap-12">
        <aside className="space-y-6">
          <img src={currentMedia.coverImage.extraLarge} className="w-full rounded-2xl shadow-2xl" alt="" />
          <button
            onClick={() => onToggleFavorite(currentMedia.id)}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all ${isFavorite ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-gray-200'}`}
          >
            {isFavorite ? <Check /> : <Plus />} {isFavorite ? 'Dans ma liste' : 'Ajouter à ma liste'}
          </button>

          <div className="bg-[#1a1d24] p-6 rounded-2xl border border-gray-800 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Star size={18} className="text-yellow-500" /> État</h3>
            <div className="flex flex-col gap-2">
              {[WatchStatus.PLAN_TO_WATCH, WatchStatus.IN_PROGRESS, WatchStatus.COMPLETED].map(s => (
                <button key={s} onClick={() => onStatusChange(currentMedia.id, s as WatchStatus)} className={`px-4 py-3 rounded-lg text-sm text-left transition-all ${currentStatus === s ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="space-y-8">
          <div>
            <div className="flex gap-2 mb-4">
              {currentMedia.genres?.map(g => <span key={g} className="text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1 rounded">{g}</span>)}
            </div>
            <h1 className="text-5xl font-black text-white mb-2">{currentMedia.title.english || currentMedia.title.romaji}</h1>
            <p className="text-xl text-gray-500">{currentMedia.title.romaji}</p>
          </div>

          <div dangerouslySetInnerHTML={{ __html: currentMedia.description }} className="text-gray-400 leading-relaxed text-lg prose prose-invert max-w-none" />

          <div className="pt-8 border-t border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-6">Épisodes</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: currentMedia.episodes || 12 }).map((_, i) => {
                const epNum = i + 1;
                const isWatched = watchedEps.includes(epNum);
                return (
                  <button
                    key={epNum}
                    onClick={() => onToggleEpisode(currentMedia.id, epNum)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isWatched ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700'}`}
                  >
                    <span className="font-bold">Épisode {epNum}</span>
                    {isWatched && <CheckCircle size={18} />}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // Navigation
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'my-list' | 'details'>('home');
  const [selectedAnimeId, setSelectedAnimeId] = useState<number | null>(null);

  // Data State
  const [trendingAnime, setTrendingAnime] = useState<Anime[]>([]);
  const [actionAnime, setActionAnime] = useState<Anime[]>([]);
  const [romanceAnime, setRomanceAnime] = useState<Anime[]>([]);
  const [comedyAnime, setComedyAnime] = useState<Anime[]>([]);
  const [featuredAnimes, setFeaturedAnimes] = useState<Anime[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [myListAnime, setMyListAnime] = useState<Anime[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Persisted User Data
  const [userData, setUserData] = useState<UserData>({ animeStatuses: {}, favoriteIds: [], watchedEpisodes: {} });
  const [userId] = useState(() => {
    let id = localStorage.getItem('ani_user_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('ani_user_id', id);
    }
    return id;
  });

  // Load from Supabase on mount
  useEffect(() => {
    const initData = async () => {
      const remoteData = await KVStorageService.getUserData(userId);
      if (remoteData) {
        setUserData(remoteData);
      } else {
        // Fallback to local storage if no remote data exists yet
        const saved = localStorage.getItem('ani_user_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (!parsed.favoriteIds) parsed.favoriteIds = [];
          if (!parsed.watchedEpisodes) parsed.watchedEpisodes = {};
          setUserData(parsed);
          // Sync to remote for the first time
          await KVStorageService.saveUserData(userId, parsed);
        }
      }
    };
    initData();
  }, [userId]);

  useEffect(() => {
    // Save to both
    localStorage.setItem('ani_user_data', JSON.stringify(userData));
    KVStorageService.saveUserData(userId, userData).catch(err => console.error("Sync error:", err));

    // Load anime objects for "Ma Liste"
    const loadMyList = async () => {
      if (userData.favoriteIds.length > 0) {
        const data = await getAnimeListByIds(userData.favoriteIds);
        setMyListAnime(data.filter(a => a !== null) as Anime[]);
      } else {
        setMyListAnime([]);
      }
    };
    loadMyList();
  }, [userData]);

  const [isLoadingHome, setIsLoadingHome] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingHome(true);
      try {
        const results = await Promise.allSettled([
          getTrendingAnime(15),
          getAnimeByCategory('Action', 15),
          getAnimeByCategory('Romance', 15),
          getAnimeByCategory('Comedy', 15)
        ]);

        if (results[0].status === 'fulfilled') setTrendingAnime(results[0].value);
        if (results[1].status === 'fulfilled') setActionAnime(results[1].value);
        if (results[2].status === 'fulfilled') setRomanceAnime(results[2].value);
        if (results[3].status === 'fulfilled') setComedyAnime(results[3].value);

        if (results[0].status === 'fulfilled' && results[0].value.length > 0) {
          const trending = results[0].value;
          setFeaturedAnimes(trending.slice(0, 5));
        }
      } catch (err) {
        console.error("Critical error loading home data:", err);
      } finally {
        setIsLoadingHome(false);
      }
    };
    loadData();
  }, []);

  // Auto-slide effect for carousel
  useEffect(() => {
    if (featuredAnimes.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % featuredAnimes.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [featuredAnimes]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    try {
      const results = await searchAnime(searchTerm);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToDetails = (id: number) => {
    setSelectedAnimeId(id);
    setCurrentView('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavorite = (animeId: number) => {
    setUserData(prev => {
      const isInList = prev.favoriteIds.includes(animeId);
      const newData = {
        ...prev,
        favoriteIds: isInList
          ? prev.favoriteIds.filter(id => id !== animeId)
          : [...prev.favoriteIds, animeId]
      };

      // Immediate sync for better UX
      if (isInList) {
        KVStorageService.removeFromFavorites(userId, animeId).catch(console.error);
      } else {
        KVStorageService.addToFavorites(userId, animeId).catch(console.error);
      }

      return newData;
    });
  };

  const updateAnimeStatus = (animeId: number, status: WatchStatus) => {
    setUserData(prev => ({
      ...prev,
      animeStatuses: { ...prev.animeStatuses, [animeId]: status }
    }));
    KVStorageService.updateAnimeStatus(userId, animeId, status).catch(console.error);
  };

  const toggleEpisodeWatched = (animeId: number, epNumber: number) => {
    setUserData(prev => {
      const currentWatched = prev.watchedEpisodes[animeId] || [];
      const isWatched = currentWatched.includes(epNumber);
      const newData = {
        ...prev,
        watchedEpisodes: {
          ...prev.watchedEpisodes,
          [animeId]: isWatched
            ? currentWatched.filter(n => n !== epNumber)
            : [...currentWatched, epNumber]
        }
      };

      KVStorageService.toggleEpisodeWatched(userId, animeId, epNumber).catch(console.error);

      return newData;
    });
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-200">
      <nav className="fixed top-0 w-full bg-[#0f1115]/80 backdrop-blur-xl border-b border-white/5 z-[100] px-8 md:px-16 flex items-center justify-between h-20">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-3 group-hover:rotate-0 transition-transform">
              <Layers size={24} className="text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter uppercase">Ani<span className="text-indigo-500">List</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => setCurrentView('home')}
              className={`text-sm font-bold transition-all ${currentView === 'home' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
              Accueil
            </button>
            <button
              onClick={() => setCurrentView('search')}
              className={`text-sm font-bold transition-all ${currentView === 'search' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
              Parcourir
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <NavButton icon={<Search size={22} />} active={currentView === 'search'} onClick={() => setCurrentView('search')} label="Rechercher" />
          <NavButton icon={<Bookmark size={22} />} active={currentView === 'my-list'} onClick={() => setCurrentView('my-list')} label="Ma Liste" />
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 overflow-hidden cursor-pointer hover:border-indigo-500 transition-colors">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" />
          </div>
        </div>
      </nav>

      <main className={`pb-24 ${currentView === 'home' ? 'pt-0' : 'pt-28 px-4 md:px-16'} max-w-[100vw] overflow-x-hidden`}>
        {currentView === 'home' && isLoadingHome && (
          <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-indigo-400 font-medium animate-pulse">Chargement de votre univers...</p>
          </div>
        )}
        {currentView === 'home' && !isLoadingHome && (
          <div className="animate-in fade-in duration-700">
            {/* Featured Banner Carousel */}
            {featuredAnimes.length > 0 && (
              <div className="relative h-[85vh] w-full overflow-hidden mb-12 group/banner">
                {featuredAnimes.map((anime, idx) => (
                  <div
                    key={anime.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                  >
                    <div className="absolute inset-0">
                      <img
                        src={anime.bannerImage || anime.coverImage.extraLarge}
                        className="w-full h-full object-cover"
                        alt={anime.title.romaji}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0f1115] via-[#0f1115]/30 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent to-transparent" />
                    </div>

                    <div className="relative h-full flex flex-col justify-center px-8 md:px-16 max-w-4xl space-y-6">
                      <div className={`transition-all duration-1000 ${idx === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        <span className="inline-flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-[0.2em] text-xs mb-4">
                          <span className="w-8 h-0.5 bg-indigo-500" /> À la une
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-2xl tracking-tight mb-6">
                          {anime.title.english || anime.title.romaji}
                        </h1>
                        <div className="text-gray-300 text-lg line-clamp-3 md:line-clamp-4 max-w-2xl drop-shadow-md mb-8 leading-relaxed overflow-hidden" dangerouslySetInnerHTML={{ __html: anime.description }} />

                        <div className="flex flex-wrap gap-4 pt-4">
                          <button
                            onClick={() => navigateToDetails(anime.id)}
                            className="flex items-center gap-3 bg-white text-black px-10 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all transform active:scale-95 shadow-2xl"
                          >
                            <Info size={22} /> Plus d'infos
                          </button>
                          <button
                            onClick={() => toggleFavorite(anime.id)}
                            className={`flex items-center gap-3 px-10 py-4 rounded-xl font-bold backdrop-blur-md border transition-all transform active:scale-95 ${userData.favoriteIds.includes(anime.id) ? 'bg-red-500 text-white border-transparent' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                          >
                            {userData.favoriteIds.includes(anime.id) ? <Check size={22} /> : <Plus size={22} />}
                            Ajouter à ma liste
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination Dots */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-30">
                  {featuredAnimes.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 transition-all duration-500 rounded-full ${idx === currentSlide ? 'w-10 bg-indigo-500' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Content Rows */}
            <div className="space-y-24 pb-20 -mt-16 relative z-20">
              {myListAnime.length > 0 && (
                <AnimeCarousel
                  title="Ma Liste"
                  items={myListAnime}
                  onDetails={navigateToDetails}
                  onToggleFavorite={toggleFavorite}
                  favoriteIds={userData.favoriteIds}
                />
              )}

              <AnimeCarousel
                title="Tendances du moment"
                items={trendingAnime}
                onDetails={navigateToDetails}
                onToggleFavorite={toggleFavorite}
                favoriteIds={userData.favoriteIds}
              />

              <AnimeCarousel
                title="Action & Aventure"
                items={actionAnime}
                onDetails={navigateToDetails}
                onToggleFavorite={toggleFavorite}
                favoriteIds={userData.favoriteIds}
              />

              <AnimeCarousel
                title="Comédie"
                items={comedyAnime}
                onDetails={navigateToDetails}
                onToggleFavorite={toggleFavorite}
                favoriteIds={userData.favoriteIds}
              />

              <AnimeCarousel
                title="Romance"
                items={romanceAnime}
                onDetails={navigateToDetails}
                onToggleFavorite={toggleFavorite}
                favoriteIds={userData.favoriteIds}
              />
            </div>
          </div>
        )}

        {currentView === 'search' && (
          <div className="space-y-8 animate-in fade-in duration-500 p-8">
            <header>
              <h1 className="text-3xl font-bold text-white mb-2">Rechercher</h1>
              <p className="text-gray-400">Découvrez de nouveaux animés et gérez votre collection.</p>
            </header>

            <form onSubmit={handleSearch} className="relative group max-w-2xl">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ex: One Piece, Jujutsu Kaisen..."
                className="w-full bg-[#1a1d24] border border-gray-800 rounded-2xl py-4 px-12 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-gray-500"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-1.5 px-4 rounded-lg">
                Chercher
              </button>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-6 gap-y-12">
              {isLoading ? Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-800 rounded-2xl aspect-[2/3]" />
              )) : searchResults.map(anime => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  onClick={() => navigateToDetails(anime.id)}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={userData.favoriteIds.includes(anime.id)}
                />
              ))}
            </div>
          </div>
        )}

        {currentView === 'my-list' && (
          <div className="space-y-8 animate-in slide-in-from-bottom duration-500 p-8">
            <header>
              <h1 className="text-3xl font-bold text-white mb-2">Ma Liste</h1>
              <p className="text-gray-400">Tous les animés que vous avez enregistrés.</p>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-6 gap-y-12">
              {myListAnime.map(anime => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  onClick={() => navigateToDetails(anime.id)}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={userData.favoriteIds.includes(anime.id)}
                />
              ))}
              {myListAnime.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-500 border-2 border-dashed border-gray-800 rounded-3xl">
                  Votre liste est vide.
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'details' && selectedAnimeId && (
          <AnimeDetailsView
            id={selectedAnimeId}
            onBack={() => setCurrentView('home')}
            userData={userData}
            onStatusChange={updateAnimeStatus}
            onToggleFavorite={toggleFavorite}
            onToggleEpisode={toggleEpisodeWatched}
          />
        )}
      </main>
    </div>
  );
};


export default App;
