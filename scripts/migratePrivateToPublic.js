/* eslint-disable @typescript-eslint/no-require-imports */
// One-time migration: convert private blob hostnames to public hostnames in MongoDB sarees.
// Run with: node scripts/migratePrivateToPublic.js

const { MongoClient } = require("mongodb");

function toPublicBlobUrl(url) {
  if (typeof url !== "string") return url;
  return url.replace(".private.blob.vercel-storage.com", ".public.blob.vercel-storage.com");
}

function normalizeSaree(item) {
  return {
    ...item,
    tileImage: toPublicBlobUrl(item.tileImage),
    colors: Array.isArray(item.colors)
      ? item.colors.map((entry) => ({
          ...entry,
          images: Array.isArray(entry.images) ? entry.images.map(toPublicBlobUrl) : [],
        }))
      : [],
  };
}

async function run() {
  const uri =
    process.env.MONGODB_URI ||
    "mongodb+srv://shubham36chavan_db_user:KPjyLqhoGOKoOznI@sareesgallery.h6l2ezp.mongodb.net/saree_gallery?appName=sareesgallery";

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();

  try {
    const db = client.db();
    const coll = db.collection("sarees");
    const docs = await coll.find({}).toArray();

    let updated = 0;
    for (const doc of docs) {
      const normalized = normalizeSaree(doc);
      const changed = JSON.stringify({
        tileImage: doc.tileImage,
        colors: doc.colors,
      }) !==
        JSON.stringify({
          tileImage: normalized.tileImage,
          colors: normalized.colors,
        });

      if (!changed) continue;
      await coll.updateOne({ _id: doc._id }, { $set: { tileImage: normalized.tileImage, colors: normalized.colors } });
      updated += 1;
    }

    console.log(`Checked ${docs.length} sarees. Updated ${updated} document(s).`);
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
