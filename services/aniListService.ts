
import { ANILIST_API_URL } from '../constants';
import { Anime } from '../types';

const ANIME_QUERY = `
  query ($id: Int, $search: String, $page: Int, $perPage: Int) {
    Page (page: $page, perPage: $perPage) {
      media (id: $id, search: $search, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          extraLarge
          color
        }
        description
        episodes
        status
        genres
        averageScore
        nextAiringEpisode {
          episode
          airingAt
          timeUntilAiring
        }
        streamingEpisodes {
          title
          thumbnail
          url
        }
        relations {
          edges {
            relationType
            node {
              id
              title {
                romaji
                english
              }
              coverImage {
                large
              }
              type
              status
              episodes
            }
          }
        }
      }
    }
  }
`;

const ANIME_BY_IDS_QUERY = `
  query ($ids: [Int]) {
    Page {
      media (id_in: $ids, type: ANIME) {
        id
        title {
          romaji
          english
        }
        coverImage {
          large
          color
        }
        episodes
        status
        nextAiringEpisode {
          episode
          airingAt
        }
      }
    }
  }
`;

export const searchAnime = async (query: string): Promise<Anime[]> => {
  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      query: ANIME_QUERY,
      variables: { search: query, page: 1, perPage: 20 }
    })
  });
  const data = await response.json();
  return data.data.Page.media;
};

export const getAnimeById = async (id: number): Promise<Anime> => {
  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      query: ANIME_QUERY,
      variables: { id }
    })
  });
  const data = await response.json();
  return data.data.Page.media[0];
};

export const getAnimeListByIds = async (ids: number[]): Promise<Partial<Anime>[]> => {
  if (ids.length === 0) return [];
  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      query: ANIME_BY_IDS_QUERY,
      variables: { ids }
    })
  });
  const data = await response.json();
  return data.data.Page.media;
};
