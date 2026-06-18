import Link from "next/link";
import { listScans, getScanStats } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function HistoryPage() {
  const scans = listScans();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            New scan
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Scan history</h1>
      </div>

      {scans.length === 0 ? (
        <p className="text-sm text-muted-foreground">No scans yet.</p>
      ) : (
        <div className="space-y-3">
          {scans.map((scan) => {
            const stats = getScanStats(scan.id);
            return (
              <Card key={scan.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">
                    {new Date(scan.createdAt).toLocaleString()}
                  </CardTitle>
                  <Badge variant={scan.status === "completed" ? "secondary" : "outline"}>
                    {scan.status}
                  </Badge>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{scan.tier ?? "full"} · {scan.mode} scan</span>
                    {scan.includeAdultIndexes && <span>· adult indexes</span>}
                    <span>
                      · {stats.total} results
                      {stats.nsfw > 0 && ` · ${stats.nsfw} NSFW`}
                    </span>
                  </div>
                  <Link href={`/scan/${scan.id}`}>
                    <Button size="sm">Open</Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}