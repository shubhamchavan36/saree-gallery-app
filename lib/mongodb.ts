import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

function stripWrappingQuotes(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function resolveMongoUri() {
  const raw = process.env.MONGODB_URI;
  if (!raw || !raw.trim()) {
    throw new Error(
      "Missing MONGODB_URI environment variable. Set it in .env.local (local) or project environment settings (deployment)."
    );
  }

  const uri = stripWrappingQuotes(raw);
  if (!/^mongodb(\+srv)?:\/\//i.test(uri)) {
    throw new Error(
      "Invalid MONGODB_URI format. It must start with mongodb:// or mongodb+srv://"
    );
  }

  return uri;
}

function resolveDbName(uri: string) {
  const match = uri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/i);
  const fromUri = match?.[1]?.trim();
  if (fromUri) return fromUri;

  const envDbName = process.env.MONGODB_DB_NAME?.trim();
  if (envDbName) return envDbName;

  return "saree_gallery";
}

// Creates/connects to a MongoDB database using the MONGODB_URI env variable.
// Results are cached to avoid opening multiple connections during hot reload or
// in serverless environments.
export async function getDb(): Promise<Db> {
  if (db && client && client.readyState === 1) return db;

  // Reset if connection is closed
  if (client && client.readyState !== 1) {
    await client.close();
    client = null;
    db = null;
  }

  const uri = resolveMongoUri();

  if (!client) {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      tls: true,
      tlsAllowInvalidCertificates: false,
      maxPoolSize: 10,
      minPoolSize: 5,
    });
    await client.connect();
  }

  db = client.db(resolveDbName(uri));
  return db;
}

// Close the MongoDB connection (useful for cleanup in serverless environments)
export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
