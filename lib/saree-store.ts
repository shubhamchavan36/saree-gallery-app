import { promises as fs } from "fs";
import path from "path";
import { MongoClient } from "mongodb";
import { randomUUID } from "crypto";
import { SareeItem, SareeStatus } from "@/types/saree";

// connection helpers --------------------------------------------------------
let cachedClient: MongoClient | null = null;
let cachedDb: ReturnType<MongoClient["db"]> | null = null;

async function connect() {
  if (cachedDb) return cachedDb;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }
  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }
  // use database specified in URI or 'saree_gallery' as fallback
  cachedDb = cachedClient.db();
  return cachedDb;
}

function getCollection() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return cachedDb!.collection<SareeItem>("sarees");
}

// data access --------------------------------------------------------------
export async function readSarees(): Promise<SareeItem[]> {
  const db = await connect();
  const coll = db.collection<SareeItem>("sarees");
  return coll.find({}).toArray();
}

export async function writeSarees(sarees: SareeItem[]) {
  const db = await connect();
  const coll = db.collection<SareeItem>("sarees");
  // replace entire collection with provided array
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
  // file uploads still stored in public/photos; change later if using blob storage
  if (!file || file.size === 0) return null;

  const photosDirPath = path.join(process.cwd(), "public", "photos");
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
