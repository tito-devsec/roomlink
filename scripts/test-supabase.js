#!/usr/bin/env node
/**
 * Quick Supabase connectivity check — run locally:  npm run test:supabase
 * Verifies the URL + publishable key work and the `hostels` table responds.
 * Uses Node's built-in fetch (Node 18+). No dependencies.
 */
const fs = require('fs');
const path = require('path');

// Load .env (simple parser, no dep)
try {
  const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  env.split('\n').forEach(line => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  });
} catch {}

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!URL || !KEY) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

(async () => {
  console.log('→ Testing', URL);
  try {
    const res = await fetch(`${URL}/rest/v1/hostels?select=id,name,price_per_month&limit=5`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    if (res.status === 401 || res.status === 403) {
      console.error(`❌ Auth rejected (${res.status}). Check the publishable key, and that RLS allows public SELECT on hostels.`);
      process.exit(1);
    }
    if (res.status === 404) {
      console.error('❌ Table "hostels" not found. Run supabase-schema.sql first.');
      process.exit(1);
    }
    const body = await res.json();
    if (!res.ok) {
      console.error(`❌ ${res.status}:`, body);
      process.exit(1);
    }
    console.log('✅ Connected. hostels rows returned:', Array.isArray(body) ? body.length : 0);
    if (Array.isArray(body) && body.length) console.table(body);
    else console.log('   (table is empty — run supabase-seed.sql to add demo rooms)');
  } catch (e) {
    console.error('❌ Network error:', e.message);
    process.exit(1);
  }
})();
