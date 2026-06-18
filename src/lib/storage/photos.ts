import fs from "fs";
import path from "path";
import { getDataDir } from "@/lib/db";

export function getPhotosDir(scanId: string) {
  const dir = path.join(getDataDir(), "photos", scanId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getThumbnailsDir() {
  const dir = path.join(getDataDir(), "thumbnails");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function saveReferencePhoto(
  scanId: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const dir = getPhotosDir(scanId);
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = path.join(dir, safeName);
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
}

export async function saveThumbnail(resultId: string, buffer: Buffer): Promise<string> {
  const dir = getThumbnailsDir();
  const filePath = path.join(dir, `${resultId}.jpg`);
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
}

export function readLocalFile(filePath: string): Buffer | null {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}