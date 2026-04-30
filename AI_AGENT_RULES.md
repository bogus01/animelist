# AI_AGENT_RULES.md

Instructions destinées à tous les agents/LLM (Claude, Cursor, Copilot, etc.) travaillant sur ce projet et sur les autres projets de l'utilisateur.

## Accès Supabase — utiliser la connection string PostgreSQL, pas le MCP ni les tokens CLI

**Règle :** pour toute opération sur la base Supabase d'un projet (lecture, écriture, inspection de schéma, debug de RLS, vérification de données), utilisez la **connection string PostgreSQL directe** stockée dans le `.env.local` du projet, sous la clé `SUPABASE_DB_URL`.

```
SUPABASE_DB_URL=postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres
```

### Pourquoi cette règle existe

L'utilisateur a plusieurs comptes Supabase et plusieurs organisations sur chaque compte. Le système des **Classic Personal Access Tokens** de Supabase est défaillant dans cette configuration : un token généré depuis le dashboard d'un compte ne donne accès qu'à une seule organisation visible, pas à toutes les orgs auxquelles l'utilisateur appartient. Résultat : `supabase link --project-ref ...` échoue avec *"Your account does not have the necessary privileges"* même quand l'utilisateur est propriétaire du projet.

Le **MCP Supabase** souffre du même problème et reste, en plus, lié à un seul compte global pour tous les projets — impossible de pointer sur un autre compte sans déconnecter/reconnecter le connecteur.

La **connection string PostgreSQL** est immune à ces problèmes :
- Elle utilise une auth password native, indépendante des tokens et des orgs.
- Elle reste valide tant que le `Reset database password` n'est pas déclenché.
- Elle est strictement par projet — chaque dossier garde sa propre URL dans son `.env.local`.

### Convention par projet

Chaque projet local dispose d'un `.env.local` à la racine contenant **au minimum** :

```
SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@<region>.pooler.supabase.com:6543/postgres
```

**Important — port 6543 (Transaction Pooler), pas 5432.** Les hôtes pooler `aws-1-*.pooler.supabase.com` rejettent les connexions SSL sur le Session Pooler (5432) avec une erreur trompeuse `password authentication failed`. Le Transaction Pooler (6543) accepte SSL normalement. Le Transaction Pooler est suffisant pour 99% des opérations (SELECT/INSERT/UPDATE/DELETE/DDL non transactionnel) — ses limites (pas de prepared statements persistants, pas de LISTEN/NOTIFY, pas de session-level state) ne concernent pas l'usage typique d'un agent.

Le `.env.local` est dans `.gitignore` et ne doit jamais être committé.

### Comment exécuter du SQL

Préférez `psql` si installé. Sinon, utilisez Node avec le package `pg` :

```js
import pg from 'pg';
const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });
await client.connect();
const { rows } = await client.query('SELECT ...');
await client.end();
```

Pour des scripts ponctuels, un fichier `scripts/db.mjs` est acceptable. Les requêtes SELECT exploratoires peuvent passer par un script jetable.

### Ce que vous pouvez encore faire avec le CLI/MCP

Les opérations qui ne touchent pas aux données peuvent rester sur le CLI/MCP **si elles fonctionnent** dans le contexte courant :
- Génération de types TypeScript depuis le schéma (alternative : générer manuellement depuis `information_schema`).
- Déploiement d'Edge Functions (rare dans ces projets).
- Consultation des logs en streaming.

En cas d'échec d'autorisation côté CLI/MCP, **ne tentez pas de réauthentifier** — passez directement par la connection PG.

### Sécurité

- Ne jamais committer `.env.local`.
- Ne jamais afficher le `SUPABASE_DB_URL` complet dans une réponse à l'utilisateur ou dans des logs partagés.
- Si l'URL fuit (chat public, screenshot, etc.), informer l'utilisateur de faire `Reset database password` immédiatement dans le dashboard du projet.

---

## Format de cette règle dans d'autres projets

Cette règle est volontairement générique. Pour la propager :

1. Copier ce fichier (`AI_AGENT_RULES.md`) à la racine de chaque nouveau projet.
2. S'assurer que le `.env.local` du projet contient bien `SUPABASE_DB_URL`.
3. Référencer ce fichier depuis le `CLAUDE.md` du projet sous une section *"Conventions"* ou *"Database access"*.
