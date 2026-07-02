import { useState, useCallback } from "react";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  status: "uploading" | "extracted" | "error";
  preview?: string;
  extractedText?: string;
}

export function AgencyUploadZone() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const incoming = Array.from(fileList).map((f) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      type: f.type,
      size: f.size,
      status: "uploading" as const,
    }));
    setFiles((prev) => [...prev, ...incoming]);

    // Simulate extraction per file
    incoming.forEach((file) => {
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: "extracted",
                  extractedText: `[Content extracted from ${file.name}]\nSample headline: "Precision torque for finishing crews"\nSample body: "The SIW 6AT-A22 delivers constant torque control..."\nChannel: meta · Format: 1x1, 9x16`,
                }
              : f,
          ),
        );
      }, 800 + Math.random() * 1200);
    });
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const formatBytes = (b: number) => (b < 1024 ? `${b}B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)}KB` : `${(b / (1024 * 1024)).toFixed(1)}MB`);

  return (
    <div className="rounded-sm border border-border bg-white">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="rounded-sm bg-amber px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
          Agency
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          Upload agency-provided content for extraction + Figma push
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-b border-dashed p-6 text-center transition-colors ${
          dragOver ? "border-hilti bg-hilti/5" : "border-border bg-background"
        }`}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.docx,.pptx,.xlsx,.png,.jpg,.txt,.csv"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
          className="hidden"
          id="agency-upload"
        />
        <label htmlFor="agency-upload" className="cursor-pointer">
          <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded border-2 border-dashed border-border">
            <span className="font-mono text-lg text-muted-foreground">+</span>
          </div>
          <p className="text-xs font-semibold">Drop agency files here or click to browse</p>
          <p className="mt-1 font-mono text-[9px] text-muted-foreground">
            PDF · PPTX · Excel · PNG/JPG · CSV · TXT
          </p>
        </label>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="divide-y divide-border">
          {files.map((f) => (
            <div key={f.id} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <span className={`size-2 shrink-0 rounded-full ${
                  f.status === "uploading" ? "bg-amber animate-pulse" :
                  f.status === "extracted" ? "bg-emerald" : "bg-red"
                }`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{f.name}</p>
                  <p className="font-mono text-[9px] text-muted-foreground">
                    {formatBytes(f.size)} · {f.status === "uploading" ? "Extracting…" : f.status === "extracted" ? "Ready" : "Error"}
                  </p>
                </div>
                <button onClick={() => removeFile(f.id)} className="font-mono text-[10px] text-muted-foreground hover:text-hilti">
                  ✕
                </button>
              </div>
              {f.extractedText && (
                <div className="mt-2 rounded-sm border border-border bg-background p-2">
                  <pre className="whitespace-pre-wrap font-mono text-[9px] leading-relaxed text-muted-foreground">
                    {f.extractedText}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Batch action */}
      {files.some((f) => f.status === "extracted") && (
        <div className="border-t border-border p-4">
          <button
            onClick={() => {
              const extracted = files.filter((f) => f.status === "extracted");
              alert(`[Prototype] Would feed ${extracted.length} extracted content items into the Content agent for Figma placement.\n\nFiles:\n${extracted.map((f) => `- ${f.name}`).join("\n")}`);
            }}
            className="w-full rounded-sm bg-amber py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-amber/90"
          >
            Feed {files.filter((f) => f.status === "extracted").length} items to Content Agent →
          </button>
        </div>
      )}
    </div>
  );
}
