/* eslint-disable @typescript-eslint/no-require-imports */
// simple test script to verify MongoDB connection via getDb helper
// usage: set MONGODB_URI=... && node scripts/testMongo.js

require('dotenv').config({ path: '../.env.local' });
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
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
