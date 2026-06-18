"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SeedUrlInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SeedUrlInput({ value, onChange }: SeedUrlInputProps) {
  return (
    <div className="space-y-2">
      <Label>URLs to check (optional)</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"Paste image or page URLs — one per line\nhttps://example.com/photo.jpg\nhttps://social.site/post/123"}
        rows={4}
        className="text-xs"
      />
      <p className="text-[11px] text-muted-foreground">
        Budget mode verifies your face against these URLs locally. Add SerpAPI key for 1 bonus Lens
        search per scan (~$0.01).
      </p>
    </div>
  );
}