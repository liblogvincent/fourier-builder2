export interface SkillProposalTemplate {
  suggestedName: string;
  suggestedType: "Rule" | "Guideline" | "Playbook" | "Document";
  suggestedScope: "Global" | "Market" | "Channel" | "Campaign";
  extractedContent: string;
}

export function formatUploadForSkillExtraction(
  fileName: string,
  fileContent: string,
): string {
  return `The user uploaded a file: "${fileName}".

Content preview:
${fileContent.slice(0, 2000)}${fileContent.length > 2000 ? "\n...(truncated)" : ""}

Analyze this file. If it contains structured knowledge (audience data, brand guidelines, benchmark KPIs, channel rules, creative playbooks), propose extracting it as a skill.

Respond with:
1. What the file contains (1 line)
2. Whether it should become a skill (yes/no)
3. If yes: suggested name, type (Rule/Guideline/Playbook/Document), and scope:
   - Campaign: only relevant to this campaign (audience data for THIS campaign)
   - Market: relevant to a specific market (DACH-specific rules)
   - Channel: relevant to a specific channel (Meta best practices)
   - Global: affects all campaigns (brand voice rules)
4. The extracted content in a structured format`;
}

export function getSkillApprovalGate(scope: string): "H4" | "in-chat" {
  return scope === "Campaign" ? "in-chat" : "H4";
}
