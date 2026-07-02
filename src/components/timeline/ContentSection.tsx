import { useState } from "react";
import { useWorkspace } from "@/store/workspace";
import { VariantCard } from "./VariantCard";

const LOCALES = ["de-DE", "de-AT", "de-CH", "fr-CH"] as const;

export function ContentSection() {
  const variants = useWorkspace((s) => s.variants);
  const [selectedLocale, setSelectedLocale] =
    useState<(typeof LOCALES)[number]>("de-DE");

  const filteredVariants = variants.filter((v) => v.locale === selectedLocale);

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Content agent · output
          </p>
          <h2 className="text-sm font-semibold">
            4 base concepts × 4 locales = {variants.length} variants
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-emerald">
          Generated · 87% confidence
        </span>
      </header>

      <div className="flex flex-wrap gap-2">
        {LOCALES.map((locale) => {
          const count = variants.filter((v) => v.locale === locale).length;
          const active = selectedLocale === locale;
          return (
            <button
              key={locale}
              onClick={() => setSelectedLocale(locale)}
              className={`rounded-sm border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                active
                  ? "border-hilti bg-hilti text-white"
                  : "border-border bg-white text-muted-foreground hover:bg-black/5"
              }`}
            >
              {locale} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {filteredVariants.map((v) => (
          <VariantCard key={v.id} variant={v} />
        ))}
      </div>
    </section>
  );
}
