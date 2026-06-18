"use client";

import { useState } from "react";
import { Eye, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ResultRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ResultCardProps {
  result: ResultRecord;
  selected?: boolean;
  onSelect?: () => void;
  onRevealed?: () => void;
}

const classificationColors: Record<string, string> = {
  good: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400",
  neutral: "bg-muted text-muted-foreground",
  bad: "bg-amber-600/15 text-amber-700 dark:text-amber-400",
  nsfw: "bg-destructive/15 text-destructive",
};

export function ResultCard({ result, selected, onSelect, onRevealed }: ResultCardProps) {
  const [revealed, setRevealed] = useState(result.userRevealed);
  const isBlurred = result.nsfwBlurRequired && !revealed && !result.blockedCsam;

  const handleReveal = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/results/${result.id}/reveal`, { method: "POST" });
    setRevealed(true);
    onRevealed?.();
  };

  return (
    <Card
      className={cn(
        "cursor-pointer overflow-hidden transition-shadow hover:shadow-md",
        selected && "ring-2 ring-primary"
      )}
      onClick={onSelect}
    >
      <div className="relative aspect-square bg-muted">
        {result.blockedCsam ? (
          <div className="flex size-full items-center justify-center p-4 text-center text-xs text-destructive">
            Blocked — report to NCMEC
          </div>
        ) : result.thumbnailPath ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/thumbnails/${result.id}${revealed ? "?reveal=1" : ""}`}
              alt=""
              className={cn("size-full object-cover", isBlurred && "blur-xl scale-105")}
            />
            {isBlurred && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Button size="sm" variant="secondary" onClick={handleReveal}>
                  <Eye className="mr-1 size-3" />
                  Reveal
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            No preview
          </div>
        )}
        <Badge
          className={cn("absolute left-2 top-2", classificationColors[result.classification])}
        >
          {result.classification}
        </Badge>
        {result.similarity != null && (
          <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
            {(result.similarity * 100).toFixed(0)}%
          </span>
        )}
      </div>
      <CardContent className="space-y-1 p-3">
        <p className="line-clamp-1 text-sm font-medium">
          {result.sourceTitle ?? result.sourceDomain ?? "Unknown source"}
        </p>
        {result.nsfwType && (
          <p className="text-xs text-destructive">
            {result.nsfwType}
            {result.nsfwSeverity ? ` · ${result.nsfwSeverity}` : ""}
          </p>
        )}
        <a
          href={result.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex text-xs text-primary underline-offset-4 hover:underline"
        >
          Source <ExternalLink className="ml-1 size-3" />
        </a>
      </CardContent>
    </Card>
  );
}