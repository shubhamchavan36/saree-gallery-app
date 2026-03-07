import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { SareeItem, SareeStatus } from "@/types/saree";

const dataPath = path.join(process.cwd(), "data", "sarees.json");
const photosDirPath = path.join(process.cwd(), "public", "photos");

async function ensureDataFile() {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.mkdir(photosDirPath, { recursive: true });

  try {
    await fs.access(dataPath);
  } catch {
    await fs.writeFile(dataPath, "[]", "utf8");
  }
}

export async function readSarees(): Promise<SareeItem[]> {
  await ensureDataFile();
  const raw = await fs.readFile(dataPath, "utf8");

  try {
    const parsed = JSON.parse(raw) as SareeItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeSarees(sarees: SareeItem[]) {
  await ensureDataFile();
  await fs.writeFile(dataPath, JSON.stringify(sarees, null, 2), "utf8");
}

export function normalizeStatus(input: string | null | undefined): SareeStatus {
  return input === "sold_out" ? "sold_out" : "available";
}

export function makeId() {
  return randomUUID();
}

export async function saveUploadedFile(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;

  await fs.mkdir(photosDirPath, { recursive: true });

  const ext = path.extname(file.name) || ".jpg";
  const base = path
    .basename(file.name, ext)
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase();
  const filename = `${base}-${Date.now()}${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(photosDirPath, filename), buffer);
  return `/photos/${filename}`;
}
