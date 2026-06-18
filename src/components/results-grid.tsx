"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResultCard } from "@/components/result-card";
import { TakedownPanel } from "@/components/takedown-panel";
import { Button } from "@/components/ui/button";
import type { ResultRecord, ScanScope, ScanStats } from "@/lib/types";
import { StatsBar } from "@/components/stats-bar";

interface ResultsGridProps {
  results: ResultRecord[];
  stats: ScanStats;
  scope?: ScanScope;
  onDismiss?: (id: string) => void;
}

export function ResultsGrid({ results, stats, scope = "all", onDismiss }: ResultsGridProps) {
  const nsfwOnly = scope === "nsfw_only";
  const [tab, setTab] = useState<string>(nsfwOnly ? "nsfw" : "all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (tab === "all") return results;
    return results.filter((r) => r.classification === tab);
  }, [results, tab]);

  const selected = results.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      {!nsfwOnly && <StatsBar stats={stats} />}

      {nsfwOnly && (
        <p className="text-sm text-destructive">
          NSFW-only results from adult sites · {stats.nsfw} match{stats.nsfw === 1 ? "" : "es"}
        </p>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {!nsfwOnly && (
            <>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="good">Good</TabsTrigger>
              <TabsTrigger value="neutral">Neutral</TabsTrigger>
              <TabsTrigger value="bad">Bad</TabsTrigger>
            </>
          )}
          <TabsTrigger value="nsfw" className="text-destructive">
            NSFW {stats.nsfw > 0 ? `(${stats.nsfw})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No results in this category.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.map((result) => (
                <ResultCard
                  key={result.id}
                  result={result}
                  selected={selectedId === result.id}
                  onSelect={() =>
                    setSelectedId(selectedId === result.id ? null : result.id)
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selected && (
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium">{selected.sourceTitle ?? "Result detail"}</h3>
              <p className="text-sm text-muted-foreground">{selected.classificationReason}</p>
              {selected.nudenetExplicit != null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  NudeNet — explicit: {(selected.nudenetExplicit * 100).toFixed(0)}%,
                  suggestive: {((selected.nudenetSuggestive ?? 0) * 100).toFixed(0)}%
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDismiss?.(selected.id)}
            >
              Not me
            </Button>
          </div>
          {selected.classification === "nsfw" && <TakedownPanel result={selected} />}
        </div>
      )}
    </div>
  );
}