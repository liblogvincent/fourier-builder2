import { createFileRoute } from "@tanstack/react-router";
import { migrateSchema, SETUP_SQL } from "@/lib/supabase";

export const Route = createFileRoute("/api/setup")({
  server: {
    handlers: {
      GET: async () => {
        const result = await migrateSchema();

        if (!result.ok) {
          return new Response(
            JSON.stringify({ status: "setup_required", error: result.error, sql: SETUP_SQL }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        const { seedCamp04 } = await import("@/lib/persistence");
        await seedCamp04();

        return new Response(
          JSON.stringify({ status: "ok" }),
          { headers: { "Content-Type": "application/json" } }
        );
      },
    },
  },
});
