import { supabase } from './supabaseClient';
import { UserData, WatchStatus } from '../types';

/**
 * Service pour gérer les données utilisateur avec Supabase
 * Remplaçant de Vercel KV pour utiliser une base de données existante
 */
export class KVStorageService {
    private static TABLE_NAME = 'animelist_user_data';

    /**
     * Sauvegarder les données utilisateur
     */
    static async saveUserData(userId: string, userData: UserData): Promise<void> {
        try {
            const { error } = await supabase
                .from(this.TABLE_NAME)
                .upsert({
                    user_id: userId,
                    data: userData,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) throw error;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde dans Supabase:', error);
            throw error;
        }
    }

    /**
     * Récupérer les données utilisateur
     */
    static async getUserData(userId: string): Promise<UserData | null> {
        try {
            const { data, error } = await supabase
                .from(this.TABLE_NAME)
                .select('data')
                .eq('user_id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                throw error;
            }

            return data?.data as UserData;
        } catch (error) {
            console.error('Erreur lors de la récupération depuis Supabase:', error);
            return null;
        }
    }

    /**
     * Supprimer les données utilisateur
     */
    static async deleteUserData(userId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from(this.TABLE_NAME)
                .delete()
                .eq('user_id', userId);

            if (error) throw error;
        } catch (error) {
            console.error('Erreur lors de la suppression dans Supabase:', error);
            throw error;
        }
    }

    /**
     * Ajouter un anime aux favoris
     */
    static async addToFavorites(userId: string, animeId: number): Promise<void> {
        try {
            let userData = await this.getUserData(userId);
            if (!userData) {
                userData = { animeStatuses: {}, favoriteIds: [], watchedEpisodes: {} };
            }

            if (!userData.favoriteIds.includes(animeId)) {
                userData.favoriteIds.push(animeId);
                await this.saveUserData(userId, userData);
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout aux favoris:', error);
            throw error;
        }
    }

    /**
     * Retirer un anime des favoris
     */
    static async removeFromFavorites(userId: string, animeId: number): Promise<void> {
        try {
            const userData = await this.getUserData(userId);
            if (userData) {
                userData.favoriteIds = userData.favoriteIds.filter(id => id !== animeId);
                await this.saveUserData(userId, userData);
            }
        } catch (error) {
            console.error('Erreur lors du retrait des favoris:', error);
            throw error;
        }
    }

    /**
     * Mettre à jour le statut d'un anime
     */
    static async updateAnimeStatus(
        userId: string,
        animeId: number,
        status: WatchStatus
    ): Promise<void> {
        try {
            let userData = await this.getUserData(userId);
            if (!userData) {
                userData = { animeStatuses: {}, favoriteIds: [], watchedEpisodes: {} };
            }
            userData.animeStatuses[animeId] = status;
            await this.saveUserData(userId, userData);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
            throw error;
        }
    }

    /**
     * Marquer/démarquer un épisode comme vu
     */
    static async toggleEpisodeWatched(
        userId: string,
        animeId: number,
        episodeNumber: number
    ): Promise<void> {
        try {
            let userData = await this.getUserData(userId);
            if (!userData) {
                userData = { animeStatuses: {}, favoriteIds: [], watchedEpisodes: {} };
            }

            const watchedEps = userData.watchedEpisodes[animeId] || [];
            const index = watchedEps.indexOf(episodeNumber);

            if (index > -1) {
                watchedEps.splice(index, 1);
            } else {
                watchedEps.push(episodeNumber);
            }

            userData.watchedEpisodes[animeId] = watchedEps;
            await this.saveUserData(userId, userData);
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'épisode:', error);
            throw error;
        }
    }
}
