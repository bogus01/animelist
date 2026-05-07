
export const ANILIST_API_URL = 'https://graphql.anilist.co';

export const DEFAULT_PLAYLISTS = [
  { id: 'default-watch', name: 'À suivre', animeIds: [], createdAt: Date.now() }
];

export const GENRE_COLORS: Record<string, string> = {
  Action: 'bg-red-500',
  Adventure: 'bg-orange-500',
  Comedy: 'bg-yellow-500',
  Drama: 'bg-purple-500',
  SciFi: 'bg-blue-500',
  Fantasy: 'bg-green-500',
  Horror: 'bg-gray-800',
  Romance: 'bg-pink-500',
};
