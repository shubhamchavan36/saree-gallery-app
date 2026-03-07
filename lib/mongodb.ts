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
  const raw =
    process.env.MONGODB_URI ||
    "mongodb+srv://shubham36chavan_db_user:KPjyLqhoGOKoOznI@sareesgallery.h6l2ezp.mongodb.net/saree_gallery?appName=sareesgallery";
  return stripWrappingQuotes(raw);
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
  if (db) return db;
  const uri = resolveMongoUri();

  if (!client) {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
  }

  db = client.db(resolveDbName(uri));
  return db;
}
