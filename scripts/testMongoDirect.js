/* eslint-disable @typescript-eslint/no-require-imports */
// quick test using mongodb driver directly
// run with MONGODB_URI env variable
require('dotenv').config({ path: '../.env.local' });
const { MongoClient } = require('mongodb');

(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://shubham36chavan_db_user:KPjyLqhoGOKoOznI@sareesgallery.h6l2ezp.mongodb.net/saree_gallery?appName=sareesgallery';
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  console.log('Using URI:', uri.replace(/:([^:@]{4})[^:@]*@/, ':$1****@')); // Hide password
  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      tls: true,
      tlsAllowInvalidCertificates: false,
      maxPoolSize: 10,
      minPoolSize: 5,
    });
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
