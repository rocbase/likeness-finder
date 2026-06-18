"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ConsentPanelProps {
  consentAccepted: boolean;
  onConsentChange: (v: boolean) => void;
  includeAdult: boolean;
  onIncludeAdultChange: (v: boolean) => void;
  adultConsent: boolean;
  onAdultConsentChange: (v: boolean) => void;
}

export function ConsentPanel({
  consentAccepted,
  onConsentChange,
  includeAdult,
  onIncludeAdultChange,
  adultConsent,
  onAdultConsentChange,
}: ConsentPanelProps) {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label htmlFor="consent" className="font-medium">
            This is my face
          </Label>
          <p className="text-xs text-muted-foreground">
            I confirm I am searching for photos of myself only.
          </p>
        </div>
        <Switch
          id="consent"
          checked={consentAccepted}
          onCheckedChange={onConsentChange}
        />
      </div>

      <Separator />

      <div className="flex items-start justify-between gap-4">
        <div>
          <Label htmlFor="adult" className="font-medium">
            Search adult content indexes (18+)
          </Label>
          <p className="text-xs text-muted-foreground">
            Includes adult platforms, forums, and deep image search. Off by default.
          </p>
        </div>
        <Switch
          id="adult"
          checked={includeAdult}
          onCheckedChange={(v) => {
            onIncludeAdultChange(v);
            if (!v) onAdultConsentChange(false);
          }}
          disabled={!consentAccepted}
        />
      </div>

      {includeAdult && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="adult-consent" className="text-destructive">
                I am 18+ and understand sensitive results may appear
              </Label>
              <p className="text-xs text-muted-foreground">
                NSFW matches are blurred by default. You control when to reveal them.
              </p>
            </div>
            <Switch
              id="adult-consent"
              checked={adultConsent}
              onCheckedChange={onAdultConsentChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}