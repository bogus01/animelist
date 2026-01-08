
export enum WatchStatus {
  PLAN_TO_WATCH = 'Plan to Watch',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed'
}

export interface StreamingEpisode {
  title: string;
  thumbnail: string;
  url: string;
}

export interface NextAiringEpisode {
  episode: number;
  airingAt: number;
  timeUntilAiring: number;
}

export interface RelatedAnime {
  id: number;
  relationType: string;
  title: {
    romaji: string;
    english: string | null;
  };
  coverImage: {
    large: string;
  };
  type: string;
  status: string;
  episodes: number | null;
}

export interface Anime {
  id: number;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  coverImage: {
    large: string;
    extraLarge: string;
    color: string;
  };
  bannerImage: string | null;
  description: string;
  episodes: number | null;
  status: string;
  genres: string[];
  averageScore: number;
  nextAiringEpisode: NextAiringEpisode | null;
  streamingEpisodes: StreamingEpisode[];
  relations: {
    edges: {
      relationType: string;
      node: {
        id: number;
        title: {
          romaji: string;
          english: string | null;
        };
        coverImage: {
          large: string;
        };
        type: string;
        status: string;
        episodes: number | null;
      }
    }[];
  };
}

export interface Playlist {
  id: string;
  name: string;
  animeIds: number[];
  createdAt: number;
}

export interface UserData {
  animeStatuses: Record<number, WatchStatus>;
  favoriteIds: number[];
  watchedEpisodes: Record<number, number[]>; // animeId -> array of episode numbers
}
