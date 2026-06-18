import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type {
  Classification,
  CreateScanInput,
  ResultRecord,
  ScanRecord,
  ScanStats,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "likeness.db");

let db: Database.Database | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDb() {
  if (!db) {
    ensureDataDir();
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'pending',
      mode TEXT NOT NULL DEFAULT 'deep',
      include_adult_indexes INTEGER NOT NULL DEFAULT 0,
      similarity_threshold REAL NOT NULL DEFAULT 0.75,
      consent_accepted INTEGER NOT NULL DEFAULT 0,
      adult_consent_accepted INTEGER NOT NULL DEFAULT 0,
      reference_photo_paths TEXT NOT NULL DEFAULT '[]',
      progress REAL NOT NULL DEFAULT 0,
      progress_message TEXT NOT NULL DEFAULT '',
      error TEXT,
      nsfw_alert_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      scan_id TEXT NOT NULL,
      source_url TEXT NOT NULL,
      source_title TEXT,
      source_domain TEXT,
      thumbnail_path TEXT,
      similarity REAL,
      verified INTEGER NOT NULL DEFAULT 0,
      classification TEXT NOT NULL DEFAULT 'unclassified',
      classification_reason TEXT,
      nsfw_type TEXT,
      nsfw_severity TEXT,
      nsfw_blur_required INTEGER NOT NULL DEFAULT 0,
      nudenet_explicit REAL,
      nudenet_suggestive REAL,
      takedown_notes TEXT,
      takedown_platform TEXT,
      recommended_action TEXT,
      user_revealed INTEGER NOT NULL DEFAULT 0,
      blocked_csam INTEGER NOT NULL DEFAULT 0,
      search_source TEXT NOT NULL DEFAULT 'unknown',
      created_at TEXT NOT NULL,
      FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_results_scan ON results(scan_id);
    CREATE INDEX IF NOT EXISTS idx_results_classification ON results(classification);
  `);

  migrateSchema(database);
}

function migrateSchema(database: Database.Database) {
  const cols = database
    .prepare("PRAGMA table_info(scans)")
    .all() as Array<{ name: string }>;
  const names = new Set(cols.map((c) => c.name));
  if (!names.has("tier")) {
    database.exec("ALTER TABLE scans ADD COLUMN tier TEXT NOT NULL DEFAULT 'full'");
  }
  if (!names.has("seed_urls")) {
    database.exec("ALTER TABLE scans ADD COLUMN seed_urls TEXT NOT NULL DEFAULT '[]'");
  }
  if (!names.has("scope")) {
    database.exec("ALTER TABLE scans ADD COLUMN scope TEXT NOT NULL DEFAULT 'all'");
  }
}

function now() {
  return new Date().toISOString();
}

function rowToScan(row: Record<string, unknown>): ScanRecord {
  return {
    id: row.id as string,
    status: row.status as ScanRecord["status"],
    mode: row.mode as ScanRecord["mode"],
    tier: ((row.tier as string) ?? "full") as ScanRecord["tier"],
    scope: ((row.scope as string) ?? "all") as ScanRecord["scope"],
    seedUrls: JSON.parse((row.seed_urls as string) ?? "[]"),
    includeAdultIndexes: Boolean(row.include_adult_indexes),
    similarityThreshold: row.similarity_threshold as number,
    consentAccepted: Boolean(row.consent_accepted),
    adultConsentAccepted: Boolean(row.adult_consent_accepted),
    referencePhotoPaths: JSON.parse(row.reference_photo_paths as string),
    progress: row.progress as number,
    progressMessage: row.progress_message as string,
    error: (row.error as string) ?? null,
    nsfwAlertCount: row.nsfw_alert_count as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    completedAt: (row.completed_at as string) ?? null,
  };
}

function rowToResult(row: Record<string, unknown>): ResultRecord {
  return {
    id: row.id as string,
    scanId: row.scan_id as string,
    sourceUrl: row.source_url as string,
    sourceTitle: (row.source_title as string) ?? null,
    sourceDomain: (row.source_domain as string) ?? null,
    thumbnailPath: (row.thumbnail_path as string) ?? null,
    similarity: row.similarity != null ? (row.similarity as number) : null,
    verified: Boolean(row.verified),
    classification: row.classification as Classification,
    classificationReason: (row.classification_reason as string) ?? null,
    nsfwType: (row.nsfw_type as ResultRecord["nsfwType"]) ?? null,
    nsfwSeverity: (row.nsfw_severity as ResultRecord["nsfwSeverity"]) ?? null,
    nsfwBlurRequired: Boolean(row.nsfw_blur_required),
    nudenetExplicit: row.nudenet_explicit != null ? (row.nudenet_explicit as number) : null,
    nudenetSuggestive:
      row.nudenet_suggestive != null ? (row.nudenet_suggestive as number) : null,
    takedownNotes: (row.takedown_notes as string) ?? null,
    takedownPlatform: (row.takedown_platform as string) ?? null,
    recommendedAction: (row.recommended_action as string) ?? null,
    userRevealed: Boolean(row.user_revealed),
    blockedCsam: Boolean(row.blocked_csam),
    searchSource: row.search_source as string,
    createdAt: row.created_at as string,
  };
}

export function createScan(input: CreateScanInput, photoPaths: string[]): ScanRecord {
  const database = getDb();
  const id = uuidv4();
  const timestamp = now();
  database
    .prepare(
      `INSERT INTO scans (
        id, status, tier, scope, mode, seed_urls, include_adult_indexes, similarity_threshold,
        consent_accepted, adult_consent_accepted, reference_photo_paths,
        progress, progress_message, created_at, updated_at
      ) VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'Waiting to start', ?, ?)`
    )
    .run(
      id,
      input.tier ?? "full",
      input.scope ?? "all",
      input.mode,
      JSON.stringify(input.seedUrls ?? []),
      input.includeAdultIndexes ? 1 : 0,
      input.similarityThreshold,
      input.consentAccepted ? 1 : 0,
      input.adultConsentAccepted ? 1 : 0,
      JSON.stringify(photoPaths),
      timestamp,
      timestamp
    );
  return getScan(id)!;
}

export function getScan(id: string): ScanRecord | null {
  const row = getDb().prepare("SELECT * FROM scans WHERE id = ?").get(id);
  return row ? rowToScan(row as Record<string, unknown>) : null;
}

export function listScans(limit = 50): ScanRecord[] {
  const rows = getDb()
    .prepare("SELECT * FROM scans ORDER BY created_at DESC LIMIT ?")
    .all(limit);
  return rows.map((row) => rowToScan(row as Record<string, unknown>));
}

export function updateScan(
  id: string,
  patch: Partial<{
    status: ScanRecord["status"];
    progress: number;
    progressMessage: string;
    error: string | null;
    nsfwAlertCount: number;
    completedAt: string | null;
  }>
) {
  const fields: string[] = ["updated_at = ?"];
  const values: unknown[] = [now()];

  if (patch.status !== undefined) {
    fields.push("status = ?");
    values.push(patch.status);
  }
  if (patch.progress !== undefined) {
    fields.push("progress = ?");
    values.push(patch.progress);
  }
  if (patch.progressMessage !== undefined) {
    fields.push("progress_message = ?");
    values.push(patch.progressMessage);
  }
  if (patch.error !== undefined) {
    fields.push("error = ?");
    values.push(patch.error);
  }
  if (patch.nsfwAlertCount !== undefined) {
    fields.push("nsfw_alert_count = ?");
    values.push(patch.nsfwAlertCount);
  }
  if (patch.completedAt !== undefined) {
    fields.push("completed_at = ?");
    values.push(patch.completedAt);
  }

  values.push(id);
  getDb()
    .prepare(`UPDATE scans SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);
}

export function insertResult(result: Omit<ResultRecord, "createdAt"> & { createdAt?: string }) {
  const timestamp = result.createdAt ?? now();
  getDb()
    .prepare(
      `INSERT INTO results (
        id, scan_id, source_url, source_title, source_domain, thumbnail_path,
        similarity, verified, classification, classification_reason,
        nsfw_type, nsfw_severity, nsfw_blur_required,
        nudenet_explicit, nudenet_suggestive,
        takedown_notes, takedown_platform, recommended_action,
        user_revealed, blocked_csam, search_source, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`
    )
    .run(
      result.id,
      result.scanId,
      result.sourceUrl,
      result.sourceTitle,
      result.sourceDomain,
      result.thumbnailPath,
      result.similarity,
      result.verified ? 1 : 0,
      result.classification,
      result.classificationReason,
      result.nsfwType,
      result.nsfwSeverity,
      result.nsfwBlurRequired ? 1 : 0,
      result.nudenetExplicit,
      result.nudenetSuggestive,
      result.takedownNotes,
      result.takedownPlatform,
      result.recommendedAction,
      result.userRevealed ? 1 : 0,
      result.blockedCsam ? 1 : 0,
      result.searchSource,
      timestamp
    );
}

export function getResultsForScan(scanId: string, classification?: Classification): ResultRecord[] {
  let rows;
  if (classification) {
    rows = getDb()
      .prepare(
        "SELECT * FROM results WHERE scan_id = ? AND classification = ? ORDER BY similarity DESC"
      )
      .all(scanId, classification);
  } else {
    rows = getDb()
      .prepare("SELECT * FROM results WHERE scan_id = ? ORDER BY similarity DESC")
      .all(scanId);
  }
  return rows.map((row) => rowToResult(row as Record<string, unknown>));
}

export function getResult(id: string): ResultRecord | null {
  const row = getDb().prepare("SELECT * FROM results WHERE id = ?").get(id);
  return row ? rowToResult(row as Record<string, unknown>) : null;
}

export function updateResult(
  id: string,
  patch: Partial<{
    userRevealed: boolean;
    classification: Classification;
    classificationReason: string;
  }>
) {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (patch.userRevealed !== undefined) {
    fields.push("user_revealed = ?");
    values.push(patch.userRevealed ? 1 : 0);
  }
  if (patch.classification !== undefined) {
    fields.push("classification = ?");
    values.push(patch.classification);
  }
  if (patch.classificationReason !== undefined) {
    fields.push("classification_reason = ?");
    values.push(patch.classificationReason);
  }

  if (fields.length === 0) return;
  values.push(id);
  getDb()
    .prepare(`UPDATE results SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);
}

export function getScanStats(scanId: string): ScanStats {
  const rows = getDb()
    .prepare(
      `SELECT classification, COUNT(*) as count FROM results
       WHERE scan_id = ? GROUP BY classification`
    )
    .all(scanId) as Array<{ classification: string; count: number }>;

  const stats: ScanStats = {
    total: 0,
    good: 0,
    neutral: 0,
    bad: 0,
    nsfw: 0,
    unclassified: 0,
  };

  for (const row of rows) {
    const key = row.classification as keyof Omit<ScanStats, "total">;
    if (key in stats) {
      stats[key] = row.count;
    }
    stats.total += row.count;
  }
  return stats;
}

export function getGoodResultsForExport(scanId: string): ResultRecord[] {
  return getResultsForScan(scanId, "good").filter((r) => r.thumbnailPath && !r.blockedCsam);
}

export function getDataDir() {
  ensureDataDir();
  return DATA_DIR;
}

export function updateScanPhotos(id: string, photoPaths: string[]) {
  getDb()
    .prepare("UPDATE scans SET reference_photo_paths = ?, updated_at = ? WHERE id = ?")
    .run(JSON.stringify(photoPaths), now(), id);
}