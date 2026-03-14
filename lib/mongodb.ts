import { MongoClient, Db } from "mongodb";

type MongoCache = {
  clientPromise?: Promise<MongoClient>;
  uri?: string;
};

declare global {
  var __mongoCache: MongoCache | undefined;
}

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

function getMongoCache(): MongoCache {
  if (!globalThis.__mongoCache) {
    globalThis.__mongoCache = {};
  }
  return globalThis.__mongoCache;
}

// Creates/connects to a MongoDB database using the MONGODB_URI env variable.
// Results are cached to avoid opening multiple connections during hot reload or
// in serverless environments.
export async function getDb(): Promise<Db> {
  const uri = resolveMongoUri();
  const cache = getMongoCache();

  if (!cache.clientPromise || cache.uri !== uri) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 0,
    });

    cache.uri = uri;
    cache.clientPromise = client.connect().catch((error) => {
      cache.clientPromise = undefined;
      throw error;
    });
  }

  const client = await cache.clientPromise;
  return client.db(resolveDbName(uri));
}

// Close the MongoDB connection (useful for cleanup in serverless environments)
export async function closeDb(): Promise<void> {
  const cache = getMongoCache();
  if (cache.clientPromise) {
    const client = await cache.clientPromise;
    await client.close();
  }
  cache.clientPromise = undefined;
  cache.uri = undefined;
}
