import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabaseUrl() {
  try {
    return import.meta.env.VITE_SUPABASE_URL
      || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
      || process.env.SUPABASE_URL
      || process.env.NEXT_PUBLIC_SUPABASE_URL
      || "";
  } catch { return ""; }
}
function getSupabaseKey() {
  try {
    return import.meta.env.VITE_SUPABASE_ANON_KEY
      || import.meta.env.SUPABASE_ANON_KEY
      || process.env.SUPABASE_ANON_KEY
      || "";
  } catch { return ""; }
}
function getServiceRoleKey() {
  try { return process.env.SUPABASE_SERVICE_ROLE_KEY || ""; } catch { return ""; }
}

function getClient(): SupabaseClient | null {
  if (_supabase) return _supabase;
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (!url || !key) return null;
  _supabase = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
  return _supabase;
}

/** Lazy Supabase client — returns null if not configured */
export function supabase(): SupabaseClient | null {
  return getClient();
}

/** Check if Supabase is configured */
export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseKey());
}

let migrated = false;

/** Run once on startup — verifies tables exist. User must create tables manually in Supabase SQL Editor. */
export async function migrateSchema(): Promise<{ ok: boolean; error?: string }> {
  if (migrated) return { ok: true };
  const client = getClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  try {
    // Check if tables exist by querying campaigns
    const { error } = await client.from("campaigns").select("id").limit(1);
    if (!error) {
      migrated = true;
      return { ok: true };
    }
    // Tables don't exist — user needs to create them
    return { ok: false, error: "Tables not found. Run CREATE TABLE SQL in Supabase SQL Editor." };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** SQL to run ONCE in Supabase SQL Editor */
export const SETUP_SQL = `-- Run this ONCE in your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  brief JSONB NOT NULL DEFAULT '{}',
  phase TEXT DEFAULT 'brief',
  state JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS runs (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;
