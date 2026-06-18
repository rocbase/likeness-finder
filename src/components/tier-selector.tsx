"use client";

import { COST_TIERS } from "@/lib/cost-tiers";
import type { ScanTier } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TierSelectorProps {
  tier: ScanTier;
  onTierChange: (tier: ScanTier) => void;
}

export function TierSelector({ tier, onTierChange }: TierSelectorProps) {
  const tiers = Object.values(COST_TIERS);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {tiers.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTierChange(t.id)}
            className={cn(
              "rounded-lg border p-3 text-left transition-colors",
              tier === t.id
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-primary/40"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{t.label}</span>
              <Badge variant={t.id === "budget" ? "secondary" : "outline"} className="text-[10px]">
                {t.perScan}
              </Badge>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{t.monthly}/mo</p>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{COST_TIERS[tier].description}</p>
    </div>
  );
}