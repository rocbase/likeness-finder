import { notFound } from "next/navigation";
import { ScanDashboard } from "@/components/scan-dashboard";
import { getScan, getScanStats, getResultsForScan } from "@/lib/db";

export default async function ScanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scan = getScan(id);
  if (!scan) notFound();

  const results = getResultsForScan(id);
  const stats = getScanStats(id);

  return (
    <ScanDashboard
      initialScan={scan}
      initialResults={results}
      initialStats={stats}
    />
  );
}