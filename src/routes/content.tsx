import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useWorkspace } from "@/store/workspace";
import { FormatPreview } from "@/components/content/FormatPreview";
import { FigmaPushPanel } from "@/components/content/FigmaPushPanel";
import { AgencyUploadZone } from "@/components/content/AgencyUploadZone";
import { useState } from "react";

export const Route = createFileRoute("/content")({
  head: () => ({
    meta: [
      { title: "Content Workspace — Fourier" },
      { name: "description", content: "Content planning, generation, format-fit, and Figma push." },
    ],
  }),
  component: ContentDashboard,
});

function ContentDashboard() {
  const variants = useWorkspace((s) => s.variants);
  const brief = useWorkspace((s) => s.brief);
  const plan = useWorkspace((s) => s.plan);
  const phase = useWorkspace((s) => s.phase);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ headline: string; primary_text: string; cta: string } | null>(null);

  const hasContent = variants.length > 0 && (phase === "content" || phase === "localization" || phase === "qa" || phase === "H2" || phase === "H-legal" || phase === "rollout" || phase === "H3" || phase === "live" || phase === "H4" || phase === "done");

  const startEdit = (v: typeof variants[0]) => {
    setEditingId(v.id);
    setEditValues({ headline: v.headline, primary_text: v.primary_text, cta: v.cta });
  };

  const saveEdit = () => {
    if (!editValues || !editingId) return;
    // In prototype: update local state (store mutation for real)
    useWorkspace.setState((s) => ({
      variants: s.variants.map((v) =>
        v.id === editingId ? { ...v, ...editValues } : v,
      ),
    }));
    setEditingId(null);
    setEditValues(null);
  };

  const cancelEdit = () => { setEditingId(null); setEditValues(null); };

  if (!hasContent) {
    return (
      <WorkspaceShell>
        <div className="mx-auto w-full max-w-5xl space-y-4 px-6 py-6">
          <header>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Content Workspace</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Content Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Content generation, format-fit preview, Figma push, and agency upload.
            </p>
          </header>
          <div className="rounded-sm border-2 border-dashed border-border bg-white py-20 text-center">
            <p className="text-sm text-muted-foreground">
              No content yet. Run the campaign pipeline through Content phase first, or upload agency content below.
            </p>
          </div>
          <AgencyUploadZone />
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-6">
        <header className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Content Workspace</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Content Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {brief.campaign} · {variants.length} variants · {brief.locales.length} locales · {brief.channels.join(", ")}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-sm bg-background px-3 py-1.5 font-mono text-[10px]">
            <span className="text-muted-foreground">Plan:</span>
            <span className="font-bold">{plan.rationale.decided.slice(0, 50)}…</span>
          </div>
        </header>

        {/* Format-fit preview grid */}
        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Format-Fit Preview · {variants.length} variants
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {variants.slice(0, 6).map((v) => (
              <div key={v.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold">{v.id}</span>
                    <span className="font-mono text-[9px] text-muted-foreground">{v.locale}</span>
                  </div>
                  <button
                    onClick={() => editingId === v.id ? cancelEdit() : startEdit(v)}
                    className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground hover:text-hilti"
                  >
                    {editingId === v.id ? "Cancel" : "Edit"}
                  </button>
                </div>
                {editingId === v.id && editValues ? (
                  <div className="space-y-2 rounded-sm border border-hilti bg-white p-3">
                    <input
                      value={editValues.headline}
                      onChange={(e) => setEditValues({ ...editValues, headline: e.target.value })}
                      className="w-full rounded-sm border border-border px-2 py-1 font-mono text-[10px]"
                      placeholder="Headline"
                    />
                    <textarea
                      value={editValues.primary_text}
                      onChange={(e) => setEditValues({ ...editValues, primary_text: e.target.value })}
                      className="w-full rounded-sm border border-border px-2 py-1 font-mono text-[10px]"
                      rows={3}
                      placeholder="Primary text"
                    />
                    <input
                      value={editValues.cta}
                      onChange={(e) => setEditValues({ ...editValues, cta: e.target.value })}
                      className="w-full rounded-sm border border-border px-2 py-1 font-mono text-[10px]"
                      placeholder="CTA"
                    />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex-1 rounded-sm bg-hilti py-1.5 font-mono text-[10px] font-bold text-white">
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <FormatPreview
                    headline={v.headline}
                    primaryText={v.primary_text}
                    cta={v.cta}
                    imageRef={v.imageRef}
                    locale={v.locale}
                    channel={v.channel}
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Figma Push */}
        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Push to Figma
          </h2>
          <FigmaPushPanel variants={variants} />
        </section>

        {/* Agency Upload */}
        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Agency Content Upload
          </h2>
          <AgencyUploadZone />
        </section>

        {/* Content plan summary */}
        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Content Plan Summary
          </h2>
          <div className="rounded-sm border border-border bg-white">
            <div className="grid grid-cols-5 border-b border-border px-4 py-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              <span>Variant</span>
              <span>Channel</span>
              <span>Locale</span>
              <span>Headline</span>
              <span>CTA</span>
            </div>
            {variants.map((v) => (
              <div key={v.id} className="grid grid-cols-5 items-center border-b border-border px-4 py-2 last:border-b-0 text-xs">
                <span className="font-mono text-[10px] font-bold">{v.id}</span>
                <span className="font-mono text-[10px] uppercase">{v.channel}</span>
                <span className="font-mono text-[10px]">{v.locale}</span>
                <span className="truncate pr-2">{v.headline}</span>
                <span className="font-mono text-[9px]">{v.cta}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
