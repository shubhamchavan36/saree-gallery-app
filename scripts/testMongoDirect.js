/* eslint-disable @typescript-eslint/no-require-imports */
// quick test using mongodb driver directly
// run with MONGODB_URI env variable
const { MongoClient } = require('mongodb');

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    console.log('Connected to', db.databaseName);
    const coll = db.collection('sarees');
    const count = await coll.countDocuments();
    console.log('sarees count', count);
    await client.close();
  } catch (err) {
    console.error('connection error', err);
    process.exit(1);
  }
})();
