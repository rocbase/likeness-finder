"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ScanTier } from "@/lib/types";

interface ScanControlsProps {
  tier: ScanTier;
  deepScan: boolean;
  onDeepScanChange: (v: boolean) => void;
  threshold: number;
  onThresholdChange: (v: number) => void;
}

export function ScanControls({
  tier,
  deepScan,
  onDeepScanChange,
  threshold,
  onThresholdChange,
}: ScanControlsProps) {
  const isBudget = tier === "budget";

  return (
    <div className="space-y-4">
      {!isBudget && (
        <div className="flex items-center justify-between">
          <div>
            <Label>Deep scan</Label>
            <p className="text-xs text-muted-foreground">
              Crawl related pages for more matches (recommended)
            </p>
          </div>
          <Switch checked={deepScan} onCheckedChange={onDeepScanChange} />
        </div>
      )}

      {isBudget && (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Budget scans skip deep crawl and paid face indexes. Uses local CompreFace + NudeNet only.
        </p>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Match threshold</Label>
          <span className="text-xs text-muted-foreground">
            {(threshold * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          min={50}
          max={95}
          value={threshold * 100}
          onChange={(e) => onThresholdChange(Number(e.target.value) / 100)}
          className="w-full accent-primary"
        />
      </div>
    </div>
  );
}