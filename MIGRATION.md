# Migration vers Supabase

## 📝 Guide de configuration

### Étape 1 : Utiliser le projet Supabase existant

Nous utilisons le projet **hotelmanagerpms** pour centraliser les données. 
Une table `animelist_user_data` a été créée dans le schéma `public`.

### Étape 2 : Variables d'environnement

Le fichier `.env.local` a été configuré avec les accès Supabase :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Étape 3 : Configurer les variables localement

1. Créez un fichier `.env.local` à la racine du projet
2. Copiez le contenu de `.env.example`
3. Remplacez les valeurs par celles fournies par Vercel

```bash
# Exemple de commande pour créer le fichier
cp .env.example .env.local
```

Ensuite, éditez `.env.local` avec vos vraies valeurs.

### Étape 4 : Lier le projet à Vercel (optionnel pour le déploiement)

Si vous voulez déployer sur Vercel :

```bash
npm install -g vercel
vercel login
vercel link
```

Les variables d'environnement seront automatiquement synchronisées.

### Étape 5 : Tester la connexion

Une fois configuré, redémarrez votre serveur de développement :

```bash
npm run dev
```

## 🔧 Utilisation du service KV

Le service `KVStorageService` est maintenant disponible. Voici comment l'utiliser :

```typescript
import { KVStorageService } from './services/kvStorageService';

// Sauvegarder les données utilisateur
await KVStorageService.saveUserData('user123', userData);

// Récupérer les données utilisateur
const userData = await KVStorageService.getUserData('user123');

// Ajouter aux favoris
await KVStorageService.addToFavorites('user123', animeId);

// Retirer des favoris
await KVStorageService.removeFromFavorites('user123', animeId);
```

## 📊 Structure des données

Les données sont stockées avec la clé : `user_data:{userId}`

Exemple de données :
```json
{
  "animeStatuses": {
    "123": "En cours",
    "456": "Terminé"
  },
  "favoriteIds": [123, 456, 789],
  "watchedEpisodes": {
    "123": [1, 2, 3],
    "456": [1, 2, 3, 4, 5]
  }
}
```

## 🚀 Prochaines étapes

1. ✅ Créer la table `animelist_user_data` sur Supabase
2. ✅ Installer `@supabase/supabase-js`
3. ✅ Configurer `.env.local`
4. ✅ Créer `supabaseClient.ts`
5. ✅ Adapter `KVStorageService.ts` pour Supabase
6. ✅ Intégrer la synchronisation dans `App.tsx`
7. ⏳ Tester la sauvegarde et récupération des données

## 💡 Notes importantes

- Les données sont stockées en JSONB dans Supabase.
- Un `userId` aléatoire est généré localement et persisté pour identifier l'utilisateur (en attendant un système d'authentification complet).
- La synchronisation est automatique à chaque modification de la liste.

## 🔗 Ressources

- [Documentation Vercel KV](https://vercel.com/docs/storage/vercel-kv)
- [SDK @vercel/kv](https://www.npmjs.com/package/@vercel/kv)
