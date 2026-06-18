"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Download, History, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaceUpload } from "@/components/face-upload";
import { ConsentPanel } from "@/components/consent-panel";
import { ScanControls } from "@/components/scan-controls";
import { TierSelector } from "@/components/tier-selector";
import { SeedUrlInput } from "@/components/seed-url-input";
import { ResultsGrid } from "@/components/results-grid";
import type { ResultRecord, ScanRecord, ScanStats, ScanTier } from "@/lib/types";
import { StatsBar } from "@/components/stats-bar";

interface ServiceStatus {
  demoMode: boolean;
  services: Record<string, boolean>;
}

interface ScanDashboardProps {
  defaultTier?: ScanTier;
  initialScan?: ScanRecord;
  initialResults?: ResultRecord[];
  initialStats?: ScanStats;
}

export function ScanDashboard({
  defaultTier = "full",
  initialScan,
  initialResults = [],
  initialStats = { total: 0, good: 0, neutral: 0, bad: 0, nsfw: 0, unclassified: 0 },
}: ScanDashboardProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [includeAdult, setIncludeAdult] = useState(false);
  const [adultConsent, setAdultConsent] = useState(false);
  const [tier, setTier] = useState<ScanTier>(initialScan?.tier ?? defaultTier);
  const [seedUrls, setSeedUrls] = useState("");
  const [deepScan, setDeepScan] = useState(true);
  const [threshold, setThreshold] = useState(0.75);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<ServiceStatus | null>(null);

  const [scan, setScan] = useState<ScanRecord | null>(initialScan ?? null);
  const [results, setResults] = useState<ResultRecord[]>(initialResults);
  const [stats, setStats] = useState<ScanStats>(initialStats);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => null);
  }, []);

  const pollScan = useCallback(async (scanId: string) => {
    const res = await fetch(`/api/scans/${scanId}`);
    if (!res.ok) return;
    const data = await res.json();
    setScan(data.scan);
    setResults(data.results);
    setStats(data.stats);

    if (data.scan.status === "completed") {
      if (data.stats.nsfw > 0) {
        toast.error(
          `${data.stats.nsfw} NSFW match${data.stats.nsfw === 1 ? "" : "es"} found — review immediately`,
          { duration: 10000 }
        );
      } else {
        toast.success("Scan complete");
      }
      return false;
    }
    if (data.scan.status === "failed") {
      toast.error(data.scan.error ?? "Scan failed");
      return false;
    }
    return true;
  }, []);

  useEffect(() => {
    if (!scan || scan.status === "completed" || scan.status === "failed" || scan.status === "pending") {
      return;
    }

    const interval = setInterval(async () => {
      const keepPolling = await pollScan(scan.id);
      if (!keepPolling) clearInterval(interval);
    }, 2000);

    return () => clearInterval(interval);
  }, [scan, pollScan]);

  const startScan = async () => {
    if (files.length === 0) {
      toast.error("Upload at least one face photo");
      return;
    }
    if (!consent) {
      toast.error("Confirm this is your face");
      return;
    }
    if (includeAdult && !adultConsent) {
      toast.error("Confirm 18+ for adult index search");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("photos", f));
      form.append("tier", tier);
      form.append("seedUrls", seedUrls);
      form.append("mode", tier === "budget" ? "standard" : deepScan ? "deep" : "standard");
      form.append("includeAdultIndexes", String(includeAdult));
      form.append("similarityThreshold", String(threshold));
      form.append("consentAccepted", String(consent));
      form.append("adultConsentAccepted", String(adultConsent));

      const createRes = await fetch("/api/scans", { method: "POST", body: form });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error ?? "Failed to create scan");

      const scanId = createData.scan.id as string;
      const startRes = await fetch(`/api/scans/${scanId}/start`, { method: "POST" });
      if (!startRes.ok) throw new Error("Failed to start scan");

      router.push(`/scan/${scanId}`);
      setScan(createData.scan);
      toast.info("Scan started…");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setSubmitting(false);
    }
  };

  const exportGood = () => {
    if (!scan) return;
    window.location.href = `/api/scans/${scan.id}/export`;
  };

  const dismissResult = async (id: string) => {
    await fetch(`/api/results/${id}/dismiss`, { method: "POST" });
    if (scan) await pollScan(scan.id);
    toast.success("Marked as not me");
  };

  const isRunning =
    scan &&
    !["pending", "completed", "failed"].includes(scan.status);

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Likeness Finder</h1>
          <p className="text-sm text-muted-foreground">
            Find photos of your face online — good, bad, and sensitive
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={tier === "budget" ? "secondary" : "outline"}
            size="sm"
            onClick={() => router.push("/budget")}
          >
            Budget
          </Button>
          <Button variant="outline" onClick={() => router.push("/history")}>
            <History className="mr-2 size-4" />
            History
          </Button>
          {scan?.status === "completed" && stats.good > 0 && (
            <Button variant="outline" onClick={exportGood}>
              <Download className="mr-2 size-4" />
              Export Good
            </Button>
          )}
        </div>
      </header>

      {status?.demoMode && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm">
          Demo mode — add API keys in <code className="text-xs">.env.local</code> for live searches.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reference photos</CardTitle>
            </CardHeader>
            <CardContent>
              <FaceUpload files={files} onChange={setFiles} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Consent</CardTitle>
            </CardHeader>
            <CardContent>
              <ConsentPanel
                consentAccepted={consent}
                onConsentChange={setConsent}
                includeAdult={includeAdult}
                onIncludeAdultChange={setIncludeAdult}
                adultConsent={adultConsent}
                onAdultConsentChange={setAdultConsent}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cost tier</CardTitle>
            </CardHeader>
            <CardContent>
              <TierSelector tier={tier} onTierChange={setTier} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scan options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tier === "budget" && (
                <SeedUrlInput value={seedUrls} onChange={setSeedUrls} />
              )}
              <ScanControls
                tier={tier}
                deepScan={deepScan}
                onDeepScanChange={setDeepScan}
                threshold={threshold}
                onThresholdChange={setThreshold}
              />
              <Button
                className="w-full"
                onClick={startScan}
                disabled={submitting || Boolean(isRunning)}
              >
                {submitting || isRunning ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Search className="mr-2 size-4" />
                )}
                {isRunning
                  ? "Scanning…"
                  : tier === "budget"
                    ? "Start budget scan"
                    : "Start deep scan"}
              </Button>
            </CardContent>
          </Card>

          {status && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Services</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(status.services).map(([name, ok]) => (
                  <div key={name} className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${ok ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
                    />
                    {name}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </aside>

        <main className="space-y-4">
          {scan && isRunning && (
            <Card>
              <CardContent className="flex items-center gap-4 py-4">
                <Loader2 className="size-5 animate-spin text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{scan.progressMessage}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${scan.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {scan.progress.toFixed(0)}%
                </span>
              </CardContent>
            </Card>
          )}

          {scan?.status === "completed" && stats.nsfw > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
              <AlertTriangle className="size-5 text-destructive" />
              <p className="text-sm">
                <strong>{stats.nsfw} NSFW match{stats.nsfw === 1 ? "" : "es"}</strong> found —
                review the NSFW tab immediately.
              </p>
            </div>
          )}

          {results.length > 0 ? (
            <ResultsGrid results={results} stats={stats} onDismiss={dismissResult} />
          ) : (
            <Card className="min-h-[400px]">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <Search className="mb-4 size-12 text-muted-foreground/40" />
                <p className="text-lg font-medium">No results yet</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Upload 1–3 clear face photos, confirm consent, and start a deep scan to find
                  your likeness across the web.
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}