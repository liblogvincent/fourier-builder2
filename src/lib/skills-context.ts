import type { RegistryArtifact } from "@/types";

export function getRelevantSkills(
  allSkills: RegistryArtifact[],
  agentName: string,
  market?: string,
): string {
  const approved = allSkills.filter((s) => s.status === "Approved" || s.status === "Proposed");

  if (approved.length === 0) return "";

  const lines: string[] = ["## Active skills (apply these rules):"];

  for (const s of approved) {
    const scopeTag = `[${s.scope}]`;
    lines.push(`- ${scopeTag} ${s.name}: ${s.body.slice(0, 200)}`);
  }

  return lines.join("\n");
}
