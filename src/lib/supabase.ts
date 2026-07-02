import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

/** Check if Supabase is configured */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}

let migrated = false;

/** Run once on app startup — calls the Supabase migrate_schema() stored procedure. */
export async function migrateSchema(): Promise<{ ok: boolean; error?: string }> {
  if (migrated) return { ok: true };
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase not configured" };

  try {
    const { error } = await supabase.rpc("migrate_schema");
    if (error) {
      // migrate_schema() function not created yet — tables may already exist from manual setup
      const { error: checkErr } = await supabase.from("campaigns").select("id").limit(1);
      if (!checkErr) {
        migrated = true;
        return { ok: true }; // Tables exist, just the RPC isn't created
      }
      console.warn("Run this once in Supabase SQL Editor:\n" + MIGRATE_FUNCTION_SQL);
      return { ok: false, error: "Run migrate_schema() function in Supabase SQL Editor (one-time setup)" };
    }
    migrated = true;
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** One-time SQL: create the migrate_schema stored procedure in Supabase SQL Editor */
export const MIGRATE_FUNCTION_SQL = `-- Run this ONCE in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)
-- Then the app auto-migrates on every deploy.

CREATE OR REPLACE FUNCTION migrate_schema()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
  );
END;
$$;`;
