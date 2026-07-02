import { useState } from "react";
import { FileUpload } from "@/components/shared/FileUpload";

type Step = "type" | "audience" | "channel" | "brief";

export function CreateContentModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>("type");
  const [contentType, setContentType] = useState("");
  const [audience, setAudience] = useState("");
  const [channel, setChannel] = useState("meta");
  const [locales, setLocales] = useState<string[]>(["de-DE"]);
  const [brief, setBrief] = useState("");

  const steps: Step[] = ["type", "audience", "channel", "brief"];
  const currentIdx = steps.indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-sm border-2 border-hilti bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Step indicator */}
        <div className="mb-4 flex gap-1">
          {steps.map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded ${
                steps.indexOf(s) <= currentIdx ? "bg-hilti" : "bg-black/10"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Content type */}
        {step === "type" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">What are we creating?</h3>
            {["Social Media Post", "Paid Media Ad", "Email", "Landing Page", "Other"].map((t) => (
              <button
                key={t}
                onClick={() => { setContentType(t); setStep("audience"); }}
                className="block w-full rounded-sm border border-border px-4 py-3 text-left text-sm hover:border-hilti hover:bg-hilti/5 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Audience */}
        {step === "audience" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Which audience?</h3>
            {["Contractor", "Specifier", "Rental"].map((a) => (
              <button
                key={a}
                onClick={() => { setAudience(a); setStep("channel"); }}
                className="block w-full rounded-sm border border-border px-4 py-3 text-left text-sm hover:border-hilti hover:bg-hilti/5 transition-colors"
              >
                {a}
              </button>
            ))}
            <div className="pt-2">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Or upload audience data
              </p>
              <FileUpload
                onFilesSelected={(files) => {
                  setAudience(`Uploaded: ${files.map((f) => f.name).join(", ")}`);
                  setStep("channel");
                }}
              />
            </div>
          </div>
        )}

        {/* Step 3: Channel + Locales */}
        {step === "channel" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Channel</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {["meta", "linkedin", "google"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setChannel(c)}
                    className={`rounded-sm border px-3 py-1.5 font-mono text-[10px] uppercase transition-colors ${
                      channel === c ? "border-hilti bg-hilti text-white" : "border-border hover:bg-black/5"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Locales</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {["de-DE", "de-AT", "de-CH", "fr-CH"].map((l) => (
                  <button
                    key={l}
                    onClick={() =>
                      setLocales((prev) =>
                        prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l],
                      )
                    }
                    className={`rounded-sm border px-3 py-1.5 font-mono text-[10px] transition-colors ${
                      locales.includes(l) ? "border-hilti bg-hilti text-white" : "border-border hover:bg-black/5"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setStep("brief")}
              className="w-full rounded-sm bg-hilti py-2 text-sm font-bold text-white transition-colors hover:bg-hilti/90"
            >
              Next →
            </button>
            <button
              onClick={() => setStep("audience")}
              className="w-full font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step 4: Brief */}
        {step === "brief" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">
              Any specific requirements for the {contentType.toLowerCase()}?
            </h3>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Describe what you need — tone, key message, visual direction, character limits, reference links..."
              className="w-full rounded-sm border border-border p-3 text-xs focus:border-hilti focus:outline-none"
              rows={5}
            />
            <FileUpload
              onFilesSelected={(files) =>
                setBrief((prev) => prev + `\n[Attached: ${files.map((f) => f.name).join(", ")}]`)
              }
            />
            <div className="flex gap-2">
              <button
                onClick={() => setStep("channel")}
                className="flex-1 rounded-sm border border-border py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-black/5"
              >
                ← Back
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-sm bg-emerald py-2 text-sm font-bold text-white transition-colors hover:bg-emerald/90"
              >
                Create with Content Agent →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
