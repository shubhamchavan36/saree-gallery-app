import { promises as fs } from "fs";
import path from "path";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { SareeItem, SareeStatus } from "@/types/saree";

// data access --------------------------------------------------------------
import { getDb } from "@/lib/mongodb";

export async function readSarees(): Promise<SareeItem[]> {
  const db = await getDb();
  const coll = db.collection<SareeItem>("sarees");
  return coll.find({}).toArray();
}

export async function writeSarees(sarees: SareeItem[]) {
  const db = await getDb();
  const coll = db.collection<SareeItem>("sarees");
  await coll.deleteMany({});
  if (sarees.length) {
    await coll.insertMany(sarees.map((s) => ({ ...s })));
  }
}

export function normalizeStatus(input: string | null | undefined): SareeStatus {
  return input === "sold_out" ? "sold_out" : "available";
}

export function makeId() {
  return randomUUID();
}

export async function saveUploadedFile(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const ext = path.extname(file.name) || ".jpg";
  const base = path
    .basename(file.name, ext)
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase();
  const filename = `${base}-${Date.now()}${ext}`;

  try {
    // Upload to Vercel Blob instead of local filesystem
    const blob = await put(filename, file, { access: 'private' });
    return blob.url;
  } catch (error) {
    console.error('Blob upload error:', error);
    throw error; // Re-throw to let API handle it
  }
}
