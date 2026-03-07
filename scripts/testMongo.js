// simple test script to verify MongoDB connection via getDb helper
// usage: set MONGODB_URI=... && node scripts/testMongo.js

const { getDb } = require("../lib/mongodb");

async function run() {
  try {
    const db = await getDb();
    console.log("Connected to", db.databaseName);
    const coll = db.collection("sarees");
    const count = await coll.countDocuments();
    console.log("sarees collection contains", count, "documents");
  } catch (err) {
    console.error("mongo test error:", err);
    process.exit(1);
  }
}

run();
