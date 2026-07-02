import { localeDiffs } from "@/fixtures/camp_04";

export function LocaleDiff() {
  return (
    <section className="rounded-sm border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Localization agent · diff
          </p>
          <h3 className="text-sm font-semibold">Per-locale changes vs. de-DE base</h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-emerald">
          3 locales adapted · 90% confidence
        </span>
      </div>
      <table className="w-full text-xs">
        <thead className="bg-black/[0.02]">
          <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2">Locale</th>
            <th className="px-4 py-2">Base (de-DE)</th>
            <th className="px-4 py-2">Localized</th>
            <th className="px-4 py-2">Why</th>
          </tr>
        </thead>
        <tbody>
          {localeDiffs.map((d) => (
            <tr key={d.locale} className="border-t border-border align-top">
              <td className="px-4 py-3 font-mono text-[11px]">{d.locale}</td>
              <td className="px-4 py-3 text-muted-foreground line-through">
                {d.base_phrase}
              </td>
              <td className="px-4 py-3 font-medium">{d.localized_phrase}</td>
              <td className="px-4 py-3 text-foreground/80">{d.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
