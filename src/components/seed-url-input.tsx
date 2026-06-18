"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SeedUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  nsfwOnly?: boolean;
}

export function SeedUrlInput({ value, onChange, nsfwOnly }: SeedUrlInputProps) {
  return (
    <div className="space-y-2">
      <Label>{nsfwOnly ? "Adult site URLs (optional)" : "URLs to check (optional)"}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          nsfwOnly
            ? "Paste porn/image board URLs — one per line\nhttps://pornhub.com/...\nhttps://imageboard.example/thread/..."
            : "Paste image or page URLs — one per line\nhttps://example.com/photo.jpg"
        }
        rows={4}
        className="text-xs"
      />
      <p className="text-[11px] text-muted-foreground">
        {nsfwOnly
          ? "Only adult/porn domains are accepted. Non-adult URLs are ignored."
          : "Budget mode verifies your face against these URLs locally. Add SerpAPI key for 1 bonus Lens search (~$0.01)."}
      </p>
    </div>
  );
}