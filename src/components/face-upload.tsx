"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FaceUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

export function FaceUpload({ files, onChange, maxFiles = 3 }: FaceUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
      const merged = [...files, ...list].slice(0, maxFiles);
      onChange(merged);
    },
    [files, maxFiles, onChange]
  );

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        )}
      >
        <Upload className="mb-2 size-8 text-muted-foreground" />
        <p className="text-sm font-medium">Drop face photos here</p>
        <p className="text-xs text-muted-foreground">1–3 clear photos of your face</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="size-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon-xs"
                className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
          {files.length < maxFiles && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:border-primary/50"
            >
              <User className="size-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}