import { Badge } from "@/components/ui/badge";
import type { ScanStats } from "@/lib/types";

export function StatsBar({ stats }: { stats: ScanStats }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary">All {stats.total}</Badge>
      <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400">
        Good {stats.good}
      </Badge>
      <Badge variant="outline">Neutral {stats.neutral}</Badge>
      <Badge className="bg-amber-600/15 text-amber-700 dark:text-amber-400">
        Bad {stats.bad}
      </Badge>
      {stats.nsfw > 0 && (
        <Badge variant="destructive" className="gap-1">
          NSFW {stats.nsfw} ⚠
        </Badge>
      )}
    </div>
  );
}