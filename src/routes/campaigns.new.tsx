import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { saveCampaign } from "@/lib/persistence";
import { useWorkspace } from "@/store/workspace";
import type { Brief } from "@/types";

export const Route = createFileRoute("/campaigns/new")({
  head: () => ({ meta: [{ title: "New brief — Fourier" }] }),
  component: NewBriefPage,
});

function NewBriefPage() {
  const navigate = useNavigate();
  const loadBrief = useWorkspace((s) => s.loadBrief);
  const setRunMode = useWorkspace((s) => s.setRunMode);
  const advance = useWorkspace((s) => s.advance);

  const [campaign, setCampaign] = useState("");
  const [product, setProduct] = useState("");
  const [market, setMarket] = useState("DACH");
  const [audience, setAudience] = useState("");
  const [objective, setObjective] = useState("");
  const [budget, setBudget] = useState(50000);
  const [locales, setLocales] = useState("de-DE, de-AT, de-CH, fr-CH");
  const [channels, setChannels] = useState("meta");
  const [runLive, setRunLive] = useState(true);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const b: Brief = {
      id: `brief_${Date.now()}`,
      campaign: campaign || "Untitled campaign",
      product,
      market,
      audience,
      channels: channels.split(",").map((s) => s.trim()).filter(Boolean),
      locales: locales.split(",").map((s) => s.trim()).filter(Boolean),
      objective,
      budget_usd: Number(budget) || 0,
      assumptions: [
        `Hero channel is ${channels.split(",")[0]?.trim() || "meta"} paid-social`,
        "Brand-voice guidelines v4.2 in force",
        "Existing tracking + deeplinks live",
      ],
    };
    saveCampaign(b);
    setRunMode(runLive ? "live" : "demo");
    loadBrief(b);
    void navigate({ to: "/" });
    // Kick off the Strategy agent immediately so the user sees it "pop up"
    // rather than having to click "Send brief to Strategy agent →" again.
    setTimeout(() => {
      void useWorkspace.getState().advance();
    }, 50);
    void advance; // keep reference (advance also available via getState)
  };

  return (
    <WorkspaceShell>
      <div className="mx-auto w-full max-w-2xl space-y-6 px-8 py-8">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Campaigns / New
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Author a brief
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The Strategy agent will read this and propose a CampaignPlan.
          </p>
        </header>

        <form onSubmit={submit} className="space-y-4 rounded-sm border border-border bg-white p-6">
          <Field label="Campaign name">
            <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="e.g. Q1 SDS-Max EMEA push" className={inputCls} required />
          </Field>
          <Field label="Product">
            <input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. TE 60-A36 rotary hammer" className={inputCls} required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Market">
              <input value={market} onChange={(e) => setMarket(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Budget (USD)">
              <input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className={inputCls} />
            </Field>
          </div>
          <Field label="Audience">
            <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. Site foremen, finishing crews" className={inputCls} required />
          </Field>
          <Field label="Objective">
            <textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={2} placeholder="What should this campaign achieve?" className={inputCls} required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Channels (comma separated)">
              <input value={channels} onChange={(e) => setChannels(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Locales (comma separated)">
              <input value={locales} onChange={(e) => setLocales(e.target.value)} className={inputCls} />
            </Field>
          </div>

          <label className="flex items-center gap-2 pt-2 text-xs">
            <input type="checkbox" checked={runLive} onChange={(e) => setRunLive(e.target.checked)} />
            <span>
              <span className="font-semibold">Live mode</span> — run real AI agents (Strategy / Content / Localization / QA / Insights). Uncheck for scripted demo.
            </span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate({ to: "/campaigns" })} className="rounded-sm border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground">
              Cancel
            </button>
            <button type="submit" className="rounded-sm bg-foreground px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-white hover:bg-hilti">
              Send to Strategy →
            </button>
          </div>
        </form>
      </div>
    </WorkspaceShell>
  );
}

const inputCls =
  "w-full rounded-sm border border-border bg-white px-3 py-2 text-sm outline-none focus:border-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
