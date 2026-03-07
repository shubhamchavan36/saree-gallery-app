import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

// Creates/connects to a MongoDB database using the MONGODB_URI env variable.
// Results are cached to avoid opening multiple connections during hot reload or
// in serverless environments.
export async function getDb(): Promise<Db> {
  if (db) return db;
  // use environment variable if set, otherwise fall back to a static URI
  const uri =
    process.env.MONGODB_URI ||
    "mongodb+srv://shubham36chavan_db_user:KPjyLqhoGOKoOznI@sareesgallery.h6l2ezp.mongodb.net/saree_gallery?appName=sareesgallery";

  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }

  // The URI may include a database name; if not, fall back to "saree_gallery".
  db = client.db();
  return db;
}
