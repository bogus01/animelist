
import React, { useState, useEffect, useMemo } from 'react';
import { Search, List, Bookmark, Trash2, Plus, ChevronLeft, Play, CheckCircle, Clock, X, Heart, ExternalLink, Calendar, Check, Layers, ArrowLeft } from 'lucide-react';
import { Anime, Playlist, WatchStatus, UserData, StreamingEpisode, NextAiringEpisode } from './types';
import { DEFAULT_PLAYLISTS } from './constants';
import { searchAnime, getAnimeById, getAnimeListByIds } from './services/aniListService';
import { getAnimeInsight } from './services/geminiService';

const App: React.FC = () => {
  // Navigation
  const [currentView, setCurrentView] = useState<'search' | 'playlists' | 'favorites' | 'details'>('search');
  const [selectedAnimeId, setSelectedAnimeId] = useState<number | null>(null);
  
  // Data State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  
  // Persisted User Data
  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem('ani_user_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.favoriteIds) parsed.favoriteIds = [];
      if (!parsed.watchedEpisodes) parsed.watchedEpisodes = {};
      return parsed;
    }
    return { playlists: DEFAULT_PLAYLISTS, animeStatuses: {}, favoriteIds: [], watchedEpisodes: {} };
  });

  useEffect(() => {
    localStorage.setItem('ani_user_data', JSON.stringify(userData));
  }, [userData]);

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

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      name: newPlaylistName.trim(),
      animeIds: [],
      createdAt: Date.now()
    };
    setUserData(prev => ({ ...prev, playlists: [...prev.playlists, newPlaylist] }));
    setNewPlaylistName('');
    setIsModalOpen(false);
  };

  const deletePlaylist = (id: string) => {
    if (id === 'default-watch') return;
    setUserData(prev => ({ ...prev, playlists: prev.playlists.filter(p => p.id !== id) }));
  };

  const toggleAnimeInPlaylist = (playlistId: string, animeId: number) => {
    setUserData(prev => ({
      ...prev,
      playlists: prev.playlists.map(p => {
        if (p.id === playlistId) {
          const exists = p.animeIds.includes(animeId);
          return {
            ...p,
            animeIds: exists ? p.animeIds.filter(id => id !== animeId) : [...p.animeIds, animeId]
          };
        }
        return p;
      })
    }));
  };

  const toggleFavorite = (animeId: number) => {
    setUserData(prev => {
      const isFav = prev.favoriteIds.includes(animeId);
      return {
        ...prev,
        favoriteIds: isFav 
          ? prev.favoriteIds.filter(id => id !== animeId) 
          : [...prev.favoriteIds, animeId]
      };
    });
  };

  const updateAnimeStatus = (animeId: number, status: WatchStatus) => {
    setUserData(prev => ({
      ...prev,
      animeStatuses: { ...prev.animeStatuses, [animeId]: status }
    }));
  };

  const toggleEpisodeWatched = (animeId: number, epNumber: number) => {
    setUserData(prev => {
      const currentWatched = prev.watchedEpisodes[animeId] || [];
      const isWatched = currentWatched.includes(epNumber);
      return {
        ...prev,
        watchedEpisodes: {
          ...prev.watchedEpisodes,
          [animeId]: isWatched 
            ? currentWatched.filter(n => n !== epNumber)
            : [...currentWatched, epNumber]
        }
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-200">
      <nav className="fixed bottom-0 w-full bg-[#161920]/95 backdrop-blur-md border-t border-gray-800 z-50 md:top-0 md:h-screen md:w-20 md:border-r md:border-t-0 md:flex-col md:justify-center md:items-center">
        <div className="flex justify-around items-center h-16 md:flex-col md:h-auto md:space-y-8">
          <NavButton icon={<Search size={24} />} active={currentView === 'search'} onClick={() => setCurrentView('search')} label="Rechercher" />
          <NavButton icon={<List size={24} />} active={currentView === 'playlists'} onClick={() => setCurrentView('playlists')} label="Playlists" />
          <NavButton icon={<Heart size={24} />} active={currentView === 'favorites'} onClick={() => setCurrentView('favorites')} label="Favoris" />
        </div>
      </nav>

      <main className="pb-24 pt-6 px-4 md:pl-24 md:pt-10 max-w-7xl mx-auto">
        {currentView === 'search' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header>
              <h1 className="text-3xl font-bold text-white mb-2 text-center md:text-left">Rechercher</h1>
              <p className="text-gray-400 text-center md:text-left">Découvrez de nouveaux animés et gérez votre collection.</p>
            </header>

            <form onSubmit={handleSearch} className="relative group max-w-2xl mx-auto md:mx-0">
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ex: One Piece, Jujutsu Kaisen..."
                className="w-full bg-[#1a1d24] border border-gray-800 rounded-2xl py-4 px-12 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-gray-500 group-focus-within:border-indigo-500"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <button 
                type="submit" 
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-colors"
              >
                Chercher
              </button>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-3">
                    <div className="bg-gray-800 rounded-2xl aspect-[2/3]" />
                    <div className="h-4 bg-gray-800 rounded w-3/4" />
                  </div>
                ))
              ) : (
                searchResults.map(anime => (
                  <div key={anime.id} className="group relative">
                    <div onClick={() => navigateToDetails(anime.id)} className="cursor-pointer space-y-3">
                      <div className="relative overflow-hidden rounded-2xl aspect-[2/3] shadow-lg ring-1 ring-gray-800 group-hover:ring-indigo-500 transition-all">
                        <img src={anime.coverImage.large} alt={anime.title.romaji} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <span className="text-xs font-bold bg-indigo-500 text-white px-2 py-1 rounded">Détails</span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-indigo-400 transition-colors">{anime.title.romaji}</h3>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(anime.id); }}
                      className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all ${userData.favoriteIds.includes(anime.id) ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}
                    >
                      <Heart size={16} fill={userData.favoriteIds.includes(anime.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {(currentView === 'playlists' || currentView === 'favorites') && (
          <div className="space-y-10 animate-in slide-in-from-bottom duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{currentView === 'playlists' ? 'Mes Playlists' : 'Favoris'}</h1>
                <p className="text-gray-400">{currentView === 'playlists' ? 'Organisez vos séries préférées par catégories.' : 'Retrouvez tout ce que vous avez marqué comme coup de cœur.'}</p>
              </div>
              {currentView === 'playlists' && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/10 active:scale-95 w-full sm:w-auto justify-center"
                >
                  <Plus size={20} />
                  <span>Nouvelle Playlist</span>
                </button>
              )}
            </header>

            <div className="grid gap-8">
              {currentView === 'playlists' ? (
                userData.playlists.map(playlist => (
                  <PlaylistSection 
                    key={playlist.id} 
                    playlist={playlist} 
                    favoriteIds={userData.favoriteIds}
                    onDelete={() => deletePlaylist(playlist.id)}
                    onAnimeClick={navigateToDetails}
                    onRemoveAnime={(animeId) => toggleAnimeInPlaylist(playlist.id, animeId)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))
              ) : (
                <PlaylistSection 
                  playlist={{ id: 'favorites-sys', name: 'Mes Coups de Cœur', animeIds: userData.favoriteIds, createdAt: 0 }} 
                  favoriteIds={userData.favoriteIds}
                  onDelete={() => {}}
                  onAnimeClick={navigateToDetails}
                  onRemoveAnime={toggleFavorite}
                  onToggleFavorite={toggleFavorite}
                  hideDelete
                />
              )}
            </div>
          </div>
        )}

        {currentView === 'details' && selectedAnimeId && (
          <AnimeDetailsView 
            id={selectedAnimeId} 
            onBack={() => setCurrentView('search')} 
            userData={userData}
            onTogglePlaylist={toggleAnimeInPlaylist}
            onStatusChange={updateAnimeStatus}
            onToggleFavorite={toggleFavorite}
            onToggleEpisode={toggleEpisodeWatched}
          />
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1a1d24] w-full max-w-md rounded-3xl p-8 border border-gray-800 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Nouvelle Playlist</h2>
            <form onSubmit={handleCreatePlaylist} className="space-y-6">
              <input 
                autoFocus
                type="text"
                placeholder="Nom de la playlist"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full bg-[#0f1115] border border-gray-800 rounded-xl py-4 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <div className="flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-semibold">Annuler</button>
                <button type="submit" disabled={!newPlaylistName.trim()} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{ icon: React.ReactNode, active: boolean, onClick: () => void, label: string }> = ({ icon, active, onClick, label }) => (
  <button onClick={onClick} className={`p-3 rounded-xl transition-all relative group ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
    {icon}
    <span className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 hidden md:block whitespace-nowrap z-50">{label}</span>
  </button>
);

const PlaylistSection: React.FC<{ 
  playlist: Partial<Playlist>, 
  favoriteIds: number[],
  onDelete: () => void, 
  onAnimeClick: (id: number) => void,
  onRemoveAnime: (id: number) => void,
  onToggleFavorite: (id: number) => void,
  hideDelete?: boolean
}> = ({ playlist, favoriteIds, onDelete, onAnimeClick, onRemoveAnime, onToggleFavorite, hideDelete }) => {
  const [animes, setAnimes] = useState<Partial<Anime>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnimes = async () => {
      if (!playlist.animeIds || playlist.animeIds.length === 0) {
        setAnimes([]);
        return;
      }
      setLoading(true);
      const data = await getAnimeListByIds(playlist.animeIds);
      setAnimes(data);
      setLoading(false);
    };
    fetchAnimes();
  }, [playlist.animeIds]);

  return (
    <section className="bg-[#161920] rounded-3xl p-6 border border-gray-800/50 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
            {playlist.id === 'favorites-sys' ? <Heart size={20} fill="currentColor" /> : <Bookmark size={20} />}
          </div>
          <h2 className="text-xl font-bold text-white">{playlist.name}</h2>
          <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full text-gray-400">{(playlist.animeIds || []).length}</span>
        </div>
        {!hideDelete && playlist.id !== 'default-watch' && (
          <button onClick={onDelete} className="text-gray-500 hover:text-red-400 p-2"><Trash2 size={18} /></button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
        {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="animate-pulse bg-gray-800 rounded-xl aspect-[2/3]" />) : (
          animes.map(anime => (
            <div key={anime.id} className="group relative">
              <div onClick={() => onAnimeClick(anime.id!)} className="cursor-pointer rounded-xl overflow-hidden aspect-[2/3] ring-1 ring-gray-800 group-hover:ring-indigo-500 transition-all">
                <img src={anime.coverImage?.large} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onRemoveAnime(anime.id!)} className="bg-red-500 text-white rounded-full p-1.5"><X size={12} /></button>
                <button onClick={() => onToggleFavorite(anime.id!)} className={`rounded-full p-1.5 ${favoriteIds.includes(anime.id!) ? 'bg-pink-500 text-white' : 'bg-black/50 text-white'}`}><Heart size={12} fill={favoriteIds.includes(anime.id!) ? 'currentColor' : 'none'} /></button>
              </div>
              <p className="text-xs mt-2 font-semibold text-gray-300 truncate">{anime.title?.romaji}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

const AnimeDetailsView: React.FC<{ 
  id: number, 
  onBack: () => void,
  userData: UserData,
  onTogglePlaylist: (pid: string, aid: number) => void,
  onStatusChange: (aid: number, s: WatchStatus) => void,
  onToggleFavorite: (id: number) => void,
  onToggleEpisode: (aid: number, ep: number) => void
}> = ({ id, onBack, userData, onTogglePlaylist, onStatusChange, onToggleFavorite, onToggleEpisode }) => {
  const [parentAnime, setParentAnime] = useState<Anime | null>(null);
  const [currentMediaId, setCurrentMediaId] = useState<number>(id);
  const [currentMedia, setCurrentMedia] = useState<Anime | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeriesHub, setIsSeriesHub] = useState(true);

  // Initial load of the "Parent" series hub
  useEffect(() => {
    const loadParent = async () => {
      setIsLoading(true);
      const data = await getAnimeById(id);
      setParentAnime(data);
      setCurrentMediaId(id);
      setCurrentMedia(data);
      setIsSeriesHub(true);
      setIsLoading(false);
    };
    loadParent();
  }, [id]);

  // Load specific media when navigating between seasons
  useEffect(() => {
    if (currentMediaId === id && parentAnime) {
      setCurrentMedia(parentAnime);
      setIsSeriesHub(true);
      return;
    }

    const loadMedia = async () => {
      setIsLoading(true);
      const data = await getAnimeById(currentMediaId);
      setCurrentMedia(data);
      const aiInsight = await getAnimeInsight(data.title.romaji, data.genres);
      setInsight(aiInsight);
      setIsLoading(false);
    };
    if (currentMediaId !== id) {
      loadMedia();
    }
  }, [currentMediaId, id, parentAnime]);

  const releasedEpisodesCount = useMemo(() => {
    if (!currentMedia) return 0;
    if (currentMedia.status === 'FINISHED') return currentMedia.episodes || 0;
    if (currentMedia.status === 'RELEASING' && currentMedia.nextAiringEpisode) return currentMedia.nextAiringEpisode.episode - 1;
    if (currentMedia.status === 'RELEASING') return currentMedia.episodes || 12; 
    return 0;
  }, [currentMedia]);

  const seasons = useMemo(() => {
    if (!currentMedia) return [];
    return currentMedia.relations.edges
      .filter(edge => ['SEQUEL', 'PREQUEL', 'SIDE_STORY', 'PARENT', 'SUMMARY'].includes(edge.relationType) && edge.node.type === 'ANIME')
      .map(edge => ({
        id: edge.node.id,
        relationType: edge.relationType,
        title: edge.node.title.romaji,
        coverImage: edge.node.coverImage.large,
        status: edge.node.status
      }));
  }, [currentMedia]);

  if (isLoading || !currentMedia) return <div className="flex items-center justify-center h-96"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const currentStatus = userData.animeStatuses[currentMedia.id] || WatchStatus.PLAN_TO_WATCH;
  const isFavorite = userData.favoriteIds.includes(currentMedia.id);
  const watchedEps = userData.watchedEpisodes[currentMedia.id] || [];

  const handleSeasonClick = (seasonId: number) => {
    setCurrentMediaId(seasonId);
    setIsSeriesHub(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHub = () => {
    setCurrentMediaId(id);
    setIsSeriesHub(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatTime = (seconds: number) => {
    const d = Math.floor(seconds / 86400), h = Math.floor((seconds % 86400) / 3600), m = Math.floor((seconds % 3600) / 60);
    return `${d}j ${h}h ${m}m`;
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 pb-20">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-all hover:-translate-x-1">
          <ChevronLeft size={20} /> <span className="font-medium">Retour à la recherche</span>
        </button>
        {!isSeriesHub && (
          <button onClick={handleBackToHub} className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl hover:bg-indigo-500/20 transition-all">
            <Layers size={18} /> <span className="font-medium">Toutes les Saisons</span>
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-12">
        <aside className="space-y-8">
          <div className="relative group">
            <img src={currentMedia.coverImage.extraLarge} className="w-full rounded-3xl shadow-2xl ring-1 ring-gray-800" alt={currentMedia.title.romaji} />
            <button onClick={() => onToggleFavorite(currentMedia.id)} className={`absolute top-4 right-4 p-4 rounded-2xl backdrop-blur-md transition-all ${isFavorite ? 'bg-red-500 text-white shadow-lg' : 'bg-black/50 text-white hover:bg-black/70'}`}><Heart size={24} fill={isFavorite ? "currentColor" : "none"} /></button>
          </div>

          <div className="bg-[#1a1d24] p-6 rounded-3xl border border-gray-800 space-y-4 shadow-xl">
            <h3 className="font-bold text-lg text-white flex items-center gap-2"><Play size={18} className="text-indigo-400" /> État de visionnage</h3>
            <div className="flex flex-col gap-2">
              {[WatchStatus.PLAN_TO_WATCH, WatchStatus.IN_PROGRESS, WatchStatus.COMPLETED].map(s => (
                <button key={s} onClick={() => onStatusChange(currentMedia.id, s as WatchStatus)} className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${currentStatus === s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'}`}>
                  <span>{s}</span>
                  {currentStatus === s && <Check size={14} />}
                </button>
              ))}
            </div>
            {watchedEps.length > 0 && (
              <div className="pt-4 border-t border-gray-800">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  <span>Progression</span>
                  <span>{watchedEps.length} / {currentMedia.episodes || releasedEpisodesCount}</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${(watchedEps.length / (currentMedia.episodes || releasedEpisodesCount)) * 100}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#1a1d24] p-6 rounded-3xl border border-gray-800 shadow-xl">
            <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2"><Bookmark size={18} className="text-indigo-400" /> Ajouter aux Playlists</h3>
            <div className="flex flex-col gap-2">
              {userData.playlists.map(p => {
                const isIn = p.animeIds.includes(currentMedia.id);
                return (
                  <button key={p.id} onClick={() => onTogglePlaylist(p.id, currentMedia.id)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isIn ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30' : 'bg-gray-800/30 text-gray-500 border border-transparent hover:border-gray-700'}`}>
                    {isIn ? <CheckCircle size={14} /> : <Plus size={14} />}
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="space-y-12">
          <header>
            <div className="flex flex-wrap gap-2 mb-4">
              {currentMedia.genres.map(g => <span key={g} className="text-[10px] font-black uppercase tracking-[0.1em] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-md">{g}</span>)}
              <span className="text-[10px] font-black uppercase tracking-[0.1em] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded-md">★ {currentMedia.averageScore}%</span>
              {!isSeriesHub && <span className="text-[10px] font-black uppercase tracking-[0.1em] bg-indigo-600 text-white px-3 py-1 rounded-md">Saison Détails</span>}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-2 tracking-tight">{currentMedia.title.romaji}</h1>
            <p className="text-xl text-gray-500 font-medium">{currentMedia.title.english || currentMedia.title.native}</p>
          </header>

          <div className="prose prose-invert max-w-none">
            <h2 className="text-xl font-bold text-white border-l-4 border-indigo-500 pl-4 mb-4">Synopsis</h2>
            <div className="text-gray-400 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: currentMedia.description }} />
          </div>

          {/* HUB VIEW: ONLY SHOW SEASONS */}
          {isSeriesHub ? (
            <div className="space-y-8 animate-in slide-in-from-right duration-500">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <h2 className="text-2xl font-black text-white flex items-center gap-3"><Layers size={24} className="text-indigo-400" /> Saisons de la série</h2>
                <span className="text-gray-500 font-bold text-sm">{seasons.length} relations</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {seasons.map(season => (
                  <div key={season.id} onClick={() => handleSeasonClick(season.id)} className="group cursor-pointer">
                    <div className="relative aspect-[2/3] rounded-3xl overflow-hidden ring-1 ring-gray-800 group-hover:ring-indigo-500 transition-all mb-4 shadow-2xl">
                      <img src={season.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={season.title} />
                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-[10px] font-black px-3 py-1.5 rounded-full text-white uppercase tracking-widest">{season.relationType.replace('_', ' ')}</div>
                      <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white text-indigo-600 p-3 rounded-full shadow-xl">
                          <Play fill="currentColor" size={24} />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-300 truncate group-hover:text-white transition-colors text-center">{season.title}</p>
                  </div>
                ))}
              </div>

              {seasons.length === 0 && (
                <div className="p-16 text-center text-gray-500 bg-[#161920] rounded-3xl border border-gray-800 border-dashed">
                  <p className="text-lg">Aucune autre saison trouvée pour cet animé.</p>
                </div>
              )}
            </div>
          ) : (
            /* SEASON DETAIL VIEW: SHOW EPISODES + OTHER SEASONS AT BOTTOM */
            <div className="space-y-12 animate-in slide-in-from-right duration-500">
              
              {currentMedia.nextAiringEpisode && (
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl shadow-indigo-500/20">
                  <div className="flex items-center gap-6">
                    <div className="bg-white/20 p-4 rounded-2xl text-white backdrop-blur-sm"><Calendar size={32} /></div>
                    <div>
                      <h3 className="text-white font-black text-2xl uppercase tracking-tight">Prochain Épisode ({currentMedia.nextAiringEpisode.episode})</h3>
                      <p className="text-indigo-100 font-medium opacity-80">Diffusion dans {formatTime(currentMedia.nextAiringEpisode.timeUntilAiring)}</p>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Date prévue</p>
                    <p className="text-white text-xl font-black">{new Date(currentMedia.nextAiringEpisode.airingAt * 1000).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                  <h2 className="text-2xl font-black text-white flex items-center gap-3"><Play size={24} className="text-indigo-400" /> Épisodes de la saison</h2>
                  <span className="text-gray-500 font-bold text-sm">{releasedEpisodesCount} épisodes sortis</span>
                </div>
                
                <div className="bg-[#161920] rounded-3xl border border-gray-800 overflow-hidden shadow-xl">
                  <div className="divide-y divide-gray-800">
                    {releasedEpisodesCount > 0 ? (
                      Array.from({ length: releasedEpisodesCount }).map((_, i) => {
                        const epNum = i + 1;
                        const streamingEp = currentMedia.streamingEpisodes.find((_, idx) => idx === i);
                        const isWatched = watchedEps.includes(epNum);
                        return (
                          <div key={epNum} className={`flex items-center justify-between p-5 group hover:bg-indigo-500/5 transition-colors ${isWatched ? 'bg-indigo-500/[0.03]' : ''}`}>
                            <div className="flex items-center gap-5 min-w-0">
                              <span className={`text-xs font-black w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isWatched ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-800 text-gray-500 group-hover:bg-gray-700'}`}>
                                {epNum}
                              </span>
                              <div className="min-w-0">
                                <h4 className={`text-base font-bold truncate ${isWatched ? 'text-indigo-400' : 'text-gray-200'}`}>
                                  {streamingEp?.title || `Épisode ${epNum}`}
                                </h4>
                                {streamingEp?.url && (
                                  <a href={streamingEp.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-gray-500 hover:text-indigo-400 flex items-center gap-1.5 mt-1 font-medium">
                                    <ExternalLink size={12} /> Regarder l'épisode
                                  </a>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={() => onToggleEpisode(currentMedia.id, epNum)}
                              className={`p-3 rounded-xl transition-all ${isWatched ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'bg-gray-800 text-gray-500 hover:text-white hover:bg-gray-700'}`}
                            >
                              <CheckCircle size={20} fill={isWatched ? "currentColor" : "none"} />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-20 text-center text-gray-500 flex flex-col items-center gap-4">
                        <Clock size={48} className="opacity-10" />
                        <p className="text-lg font-medium">Cette saison n'a pas encore d'épisodes diffusés.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {insight && (
                <div className="bg-[#1a1d24] p-8 rounded-3xl border border-indigo-500/10 shadow-xl relative group">
                  <div className="flex items-center gap-3 mb-4 text-indigo-400">
                    <Heart size={20} className="animate-pulse" /> 
                    <span className="font-black text-xs uppercase tracking-widest">Pourquoi regarder cette saison ?</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed italic text-lg font-medium">"{insight}"</p>
                </div>
              )}

              {/* OTHER SEASONS MINI GRID AT BOTTOM */}
              <div className="space-y-6 pt-12 border-t border-gray-800">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Layers size={20} className="text-indigo-400" /> Autres Saisons</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {seasons.map(season => (
                    <div key={season.id} onClick={() => handleSeasonClick(season.id)} className="flex-shrink-0 w-36 cursor-pointer group">
                      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden ring-1 ring-gray-800 group-hover:ring-indigo-500 transition-all mb-3 shadow-lg">
                        <img src={season.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={season.title} />
                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-[8px] font-black px-2 py-1 rounded text-white uppercase tracking-widest">{season.relationType.replace('_', ' ')}</div>
                      </div>
                      <p className="text-[11px] font-bold text-gray-400 truncate group-hover:text-white transition-colors">{season.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default App;
