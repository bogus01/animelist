import pg from 'pg';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const dbUrl = envContent.match(/^SUPABASE_DB_URL=(.+)$/m)?.[1]?.trim();

if (!dbUrl) {
  console.error('SUPABASE_DB_URL not found in .env.local');
  process.exit(1);
}

const u = new URL(dbUrl);
console.log('Parsed:', {
  host: u.hostname,
  port: u.port,
  user: decodeURIComponent(u.username),
  passwordLength: decodeURIComponent(u.password).length,
  database: u.pathname.slice(1),
});

const client = new pg.Client({
  host: u.hostname,
  port: parseInt(u.port, 10),
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log('Connected.');

  const before = await client.query(
    'SELECT user_id, data, updated_at FROM animelist_user_data ORDER BY updated_at DESC'
  );
  console.log('\n=== BEFORE ===');
  console.table(before.rows.map(r => ({
    user_id: r.user_id,
    favoriteIds: JSON.stringify(r.data.favoriteIds),
    updated_at: r.updated_at.toISOString(),
  })));

  const targetUser = before.rows[0]?.user_id;
  if (!targetUser) {
    console.error('No user found to test on');
    process.exit(1);
  }

  const TEST_ANIME_ID = 999999;
  console.log(`\nAdding test favorite ${TEST_ANIME_ID} to ${targetUser}...`);

  await client.query(
    `UPDATE animelist_user_data
     SET data = jsonb_set(
       data,
       '{favoriteIds}',
       (COALESCE(data->'favoriteIds', '[]'::jsonb) || to_jsonb($1::int))
     ),
     updated_at = NOW()
     WHERE user_id = $2`,
    [TEST_ANIME_ID, targetUser]
  );

  const after = await client.query(
    'SELECT user_id, data, updated_at FROM animelist_user_data WHERE user_id = $1',
    [targetUser]
  );
  console.log('\n=== AFTER ===');
  console.table(after.rows.map(r => ({
    user_id: r.user_id,
    favoriteIds: JSON.stringify(r.data.favoriteIds),
    updated_at: r.updated_at.toISOString(),
  })));

  console.log('\nCleanup: removing test favorite...');
  await client.query(
    `UPDATE animelist_user_data
     SET data = jsonb_set(
       data,
       '{favoriteIds}',
       (data->'favoriteIds') - ((jsonb_array_length(data->'favoriteIds') - 1)::int)
     )
     WHERE user_id = $1`,
    [targetUser]
  );
  console.log('Cleanup done.');
} finally {
  await client.end();
}
