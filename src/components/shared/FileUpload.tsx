import { useState, useCallback, type DragEvent } from "react";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
}

export function FileUpload({ onFilesSelected, accept = ".pdf,.docx,.xlsx,.png,.jpg,.json,.csv,.txt" }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFilesSelected(files);
    },
    [onFilesSelected],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) onFilesSelected(files);
    },
    [onFilesSelected],
  );

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex cursor-pointer items-center gap-2 rounded-sm border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
        dragging
          ? "border-hilti bg-hilti/10 text-hilti"
          : "border-dashed border-border text-muted-foreground hover:border-hilti/40 hover:bg-black/[0.02]"
      }`}
    >
      <span>⬆ Upload</span>
      <input
        type="file"
        accept={accept}
        multiple
        onChange={handleChange}
        className="hidden"
      />
    </label>
  );
}
