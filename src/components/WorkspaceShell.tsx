import { Sidebar } from "@/components/nav/Sidebar";
import { PartnerRail } from "./partner/PartnerRail";
import type { ReactNode } from "react";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-workshop-bg text-foreground">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden bg-white">
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
      <aside className="hidden w-80 flex-col border-l border-border bg-[color-mix(in_oklab,var(--background),white_20%)] lg:flex">
        <PartnerRail />
      </aside>
    </div>
  );
}
