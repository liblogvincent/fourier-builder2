const INTEGRATIONS = [
  { name: "580ai (Claude Opus 4.8)", live: true },
  { name: "Figma (read)", live: false },
  { name: "Contentful (write)", live: false },
  { name: "Adobe Firefly", live: false },
  { name: "Meta Ads API", live: false },
  { name: "Google Ads API", live: false },
  { name: "LinkedIn Ads API", live: false },
  { name: "Transperfect", live: false },
  { name: "Sprinklr", live: false },
  { name: "Power BI", live: false },
];

export function IntegrationStatus() {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-1.5">
      {INTEGRATIONS.map((int) => (
        <span
          key={int.name}
          className={`font-mono text-[9px] uppercase tracking-wider ${
            int.live ? "text-emerald" : "text-muted-foreground"
          }`}
          title={int.live ? "Live" : "Stub — no API key"}
        >
          {int.live ? "✓" : "○"} {int.name}
        </span>
      ))}
    </div>
  );
}
