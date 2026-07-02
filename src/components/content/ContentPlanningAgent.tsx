import { useState } from "react";
import { useWorkspace } from "@/store/workspace";
import { CONTENT_PLANNING_PROMPT } from "@/lib/agent-prompts";

const GUIDANCE = {
  idle: {
    message: "I'm the Content Planning Agent. I handle Epic 2 (CP1-CP4): Creative Concept, Cross-Channel Requirements, Storyboarding, and Figma Mapping. When you're ready, I'll generate the full content plan.",
    suggestions: [
      "Generate Creative Concept (CP1)",
      "Show cross-channel requirements (CP2)",
      "Build storyboard (CP3)",
      "Create Figma board with placeholders (CP4)",
    ],
  },
  generating: {
    message: "Generating the content plan — Creative Concept, asset requirements, storyboard directions, and Figma board structure. This covers what the RMB Content Planning team (Jordon) does today in ~5 days per campaign.",
    suggestions: [],
  },
  done: {
    message: "Content plan is ready. I've generated the Creative Concept (Big Idea, Key Visual, Master Story), cross-channel asset requirements, storyboard directions, and Figma board mapping. Review the tiers below — each one builds on the previous.",
    suggestions: [
      "Explain the Big Idea and creative direction",
      "Show me the cross-channel asset breakdown",
      "What's on the Figma board?",
      "How do the storyboards connect to Tier 2 variations?",
    ],
  },
};

const RESPONSES: Record<string, string> = {
  "creative concept": `Here's the Creative Concept (CP1):

**Big Idea (Head):** Precision torque for DACH finishing crews — the SIW 6AT-A22 eliminates over-tightening, the #1 contractor frustration on finishing bolts.

**Look & Feel (Heart):** Hilti Red #D2051E dominant. Industrial textures — concrete dust, steel shavings, jobsite lighting. Technical close-ups of the torque control mechanism. Maize Gold #F4D09B accents for CTAs.

**Key Visual (Hands):** Foreman mid-task in a dust-lit workshop, SIW 6AT-A22 in frame, torque readout visible. This shows tangibility — what the campaign actually delivers.

**Master Story:** Three message pillars:
1. Precision — constant torque control protects fasteners
2. Durability — brushless motor rated 2,000+ hours, IP56
3. Productivity — 30% faster rundown, one battery per shift

This concept becomes the single source of truth for all downstream content. The Figma board (CP4) will have named frames for every required asset.`,

  "cross-channel": `Cross-Channel Content Requirements (CP2):

| Channel | Assets | Formats | Specs |
|---------|--------|---------|-------|
| Paid Media (Meta) | 4 ads × 4 locales = 16 | 9×16, 16×9, 1×1, 4×5 | Headline ≤40ch, Body ≤125ch |
| Paid Media (LinkedIn) | 2 ads × 4 locales = 8 | 16×9, 1×1 | Headline ≤70ch, Intro ≤150ch |
| Organic Social | 3 posts × 4 locales = 12 | 9×16, 1×1 | Platform-specific |
| HOL Landing Page | 1 LP × 4 locales = 4 | Promo template | Contentful rebuild per MO |
| HOL Banners | 3 banners × 4 locales = 12 | Per Contentful space | Must rebuild per MO space |
| Email | 2 emails × 4 locales = 8 | SFMC template | Excel basefile required |
| **Total** | **60 assets** | | |

This feeds into CP3 (Storyboarding) and CP4 (Figma Mapping). Each asset gets a named frame on the Figma board with placeholder layers.`,

  "storyboard": `Storyboard & Creative Briefing (CP3):

**Video Storyboard — 15s Product Demo:**
- 0-3s: Close-up torque control mechanism, dust particles in light
- 3-7s: Wide jobsite shot, foreman using tool on finishing bolts
- 7-12s: Split screen — with/without SIW 6AT-A22 (time comparison)
- 12-15s: CTA overlay "Präzision, die hält" + dealer locator URL

**Photo Shotlist:**
- Shot 1: Hero product on white (all formats)
- Shot 2: Tool in-hand, close-up grip (9×16 portrait)
- Shot 3: Jobsite environmental (16×9 landscape)
- Shot 4: Battery + charger bundle (1×1 square)

**Production Plan:** AI-generated images via Adobe Firefly for static ads. Agency video for the 15s demo. Estimated 3 production days.`,

  "figma board": `Figma Mapping (CP4):

I'll build a Figma board with these sections:

**Page 1 — Master Content**
- Frame: Big Idea + Look & Feel reference
- Frame: Key Visual (hero image placeholder)
- Frame: Master Story (3 message pillars as text layers)

**Page 2 — Paid Media**
- Frame per variant (16 frames: 4 concepts × 4 locales)
- Each frame: headline text layer, body text layer, CTA button, image placeholder
- Format variants as nested components (9×16, 16×9, 1×1, 4×5)

**Page 3 — Social & Email**
- Organic social frames (12 frames)
- Email mockup frames (8 frames)
- HOL landing page + banner frames (16 frames)

**Total: ~52 frames with named placeholders.**
The Content Creation agents (C1-C8) will fill these placeholders with generated or uploaded assets.`,
};

export function ContentPlanningAgent() {
  const phase = useWorkspace((s) => s.phase);
  const hasContent = useWorkspace((s) => s.variants.length > 0);
  const [messages, setMessages] = useState<{ from: "agent" | "user"; text: string }[]>([]);
  const [input, setInput] = useState("");

  const state = hasContent ? "done" : "idle";
  const guidance = GUIDANCE[state];

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");
    setTimeout(() => {
      let response = "Good question. Let me provide the full detail on that. ";
      const q = text.toLowerCase();
      for (const [key, val] of Object.entries(RESPONSES)) {
        if (q.includes(key)) { response = val; break; }
      }
      setMessages((prev) => [...prev, { from: "agent", text: response }]);
    }, 800 + Math.random() * 1200);
  };

  return (
    <div className="rounded-sm border-2 border-purple/30 bg-white">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-purple/5">
        <div className="flex size-7 items-center justify-center rounded-full bg-purple text-white">
          <span className="font-mono text-[9px] font-bold">CP</span>
        </div>
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider">
            Content Planning Agent <span className="text-purple/60">· Epic 2 · CP1-CP4</span>
          </p>
          <p className="font-mono text-[8px] text-muted-foreground">
            RMB: Jordon (Creative Manager + Designer + Copywriter) · Today: ~5 days → Target: hours
          </p>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="p-4 space-y-3">
          <p className="text-xs leading-relaxed">{guidance.message}</p>
          <div className="flex flex-wrap gap-1.5">
            {guidance.suggestions.map((s) => (
              <button key={s} onClick={() => sendMessage(s)} className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] hover:border-purple/40 transition-colors">
                {s}
              </button>
            ))}
            <details className="mt-3">
              <summary className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground">
                View agent prompt →
              </summary>
              <pre className="mt-2 rounded-sm border border-border bg-background p-3 font-mono text-[8px] leading-relaxed text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
                {CONTENT_PLANNING_PROMPT}
              </pre>
            </details>
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div className="max-h-80 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.from === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`shrink-0 size-5 rounded-full flex items-center justify-center font-mono text-[7px] font-bold text-white ${m.from === "agent" ? "bg-purple" : "bg-hilti"}`}>
                {m.from === "agent" ? "CP" : "U"}
              </div>
              <div className={`rounded-sm px-3 py-2 text-xs max-w-[85%] ${m.from === "agent" ? "bg-background border border-border" : "bg-hilti text-white"}`}>
                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-border px-4 py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Ask about Creative Concept, cross-channel requirements, storyboards, Figma mapping…"
          className="flex-1 rounded-sm border border-border bg-background px-3 py-1.5 text-xs focus:border-purple/40 focus:outline-none"
        />
        <button onClick={() => sendMessage(input)} disabled={!input.trim()} className="rounded-sm bg-purple px-3 py-1.5 font-mono text-[9px] font-bold text-white hover:bg-purple/90 disabled:opacity-30">
          Send
        </button>
      </div>
    </div>
  );
}
