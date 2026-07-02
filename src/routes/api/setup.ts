import { createFileRoute } from "@tanstack/react-router";
import { migrateSchema, MIGRATE_FUNCTION_SQL } from "@/lib/supabase";

/** GET /api/setup — runs schema migration and seeds camp_04. Called once on app startup. */
export const Route = createFileRoute("/api/setup")({
  server: {
    handlers: {
      GET: async () => {
        const result = await migrateSchema();

        if (!result.ok) {
          return new Response(
            JSON.stringify({
              status: "setup_required",
              message: result.error,
              sql: MIGRATE_FUNCTION_SQL,
              instructions: "Copy the SQL above and run it once in your Supabase SQL Editor. Then reload.",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        // Seed camp_04 if needed
        const { seedCamp04 } = await import("@/lib/persistence");
        await seedCamp04();

        return new Response(
          JSON.stringify({ status: "ok", message: "Schema migrated and seeded." }),
          { headers: { "Content-Type": "application/json" } }
        );
      },
    },
  },
});
