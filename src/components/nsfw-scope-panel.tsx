"use client";

import { AlertTriangle } from "lucide-react";
import { ADULT_SITE_CATEGORIES } from "@/lib/adult-sites";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface NsfwScopePanelProps {
  consentAccepted: boolean;
  onConsentChange: (v: boolean) => void;
  adultConsent: boolean;
  onAdultConsentChange: (v: boolean) => void;
}

export function NsfwScopePanel({
  consentAccepted,
  onConsentChange,
  adultConsent,
  onAdultConsentChange,
}: NsfwScopePanelProps) {
  return (
    <div className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div>
          <p className="text-sm font-medium text-destructive">NSFW-only mode</p>
          <p className="text-xs text-muted-foreground">
            Searches are restricted to porn tubes, image boards, and adult forums only.
            Non-adult sites are excluded.
          </p>
        </div>
      </div>

      <ul className="space-y-1 text-[11px] text-muted-foreground">
        {ADULT_SITE_CATEGORIES.map((cat) => (
          <li key={cat}>· {cat}</li>
        ))}
      </ul>

      <div className="flex items-start justify-between gap-4">
        <div>
          <Label htmlFor="nsfw-consent" className="font-medium">
            This is my face
          </Label>
          <p className="text-xs text-muted-foreground">
            I confirm I am searching for my own likeness on adult sites only.
          </p>
        </div>
        <Switch id="nsfw-consent" checked={consentAccepted} onCheckedChange={onConsentChange} />
      </div>

      <div className="rounded-lg border border-destructive/20 bg-background/60 p-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label htmlFor="nsfw-adult-consent" className="text-destructive">
              I am 18+ (required)
            </Label>
            <p className="text-xs text-muted-foreground">
              All results are NSFW and blurred until you reveal them.
            </p>
          </div>
          <Switch
            id="nsfw-adult-consent"
            checked={adultConsent}
            onCheckedChange={onAdultConsentChange}
            disabled={!consentAccepted}
          />
        </div>
      </div>
    </div>
  );
}