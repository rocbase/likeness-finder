"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResultRecord } from "@/lib/types";

export function TakedownPanel({ result }: { result: ResultRecord }) {
  if (result.blockedCsam) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm">
        <p className="font-medium text-destructive">Content blocked</p>
        <p className="mt-1 text-muted-foreground">
          This result may depict illegal content. Do not view or share. Report to{" "}
          <a
            href="https://www.missingkids.org/gethelpnow/cybertipline"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            NCMEC CyberTipline
          </a>
          .
        </p>
      </div>
    );
  }

  if (!result.takedownNotes) return null;

  const links = result.takedownNotes
    .split("\n")
    .filter((line) => line.startsWith("- "))
    .map((line) => {
      const match = line.match(/^- (.+): (https?:\/\/.+)$/);
      return match ? { label: match[1], url: match[2] } : null;
    })
    .filter(Boolean) as Array<{ label: string; url: string }>;

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div>
        <p className="text-sm font-medium">Takedown guidance</p>
        <p className="text-xs text-muted-foreground">
          Platform: {result.takedownPlatform ?? "unknown"} · Action:{" "}
          {result.recommendedAction ?? "review"}
        </p>
      </div>
      <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
        {result.takedownNotes}
      </pre>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button variant="outline" size="sm">
              {link.label}
              <ExternalLink className="ml-1 size-3" />
            </Button>
          </a>
        ))}
        <a
          href={result.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <Button variant="outline" size="sm">
            Open source
            <ExternalLink className="ml-1 size-3" />
          </Button>
        </a>
      </div>
    </div>
  );
}