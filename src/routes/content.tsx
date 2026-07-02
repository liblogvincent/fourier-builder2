import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { CreateContentModal } from "@/components/content/CreateContentModal";
import { ContentAgentSidebar } from "@/components/content/ContentAgentSidebar";
import { useState } from "react";

export const Route = createFileRoute("/content")({
  head: () => ({
    meta: [
      { title: "Content Workspace — Fourier" },
      { name: "description", content: "Create and manage campaign content with AI assistance." },
    ],
  }),
  component: ContentWorkspace,
});

function ContentWorkspace() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <WorkspaceShell>
      <div className="mx-auto w-full max-w-6xl space-y-4 px-6 py-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Content workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Create & manage content
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create social posts, paid ads, emails, and landing pages. The Content Agent helps at every step.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-sm bg-hilti px-4 py-2 text-sm font-bold text-white shadow-lg transition-colors hover:bg-hilti/90"
          >
            + Create
          </button>
        </header>

        {showCreate && <CreateContentModal onClose={() => setShowCreate(false)} />}
        <ContentAgentSidebar />
      </div>
    </WorkspaceShell>
  );
}
