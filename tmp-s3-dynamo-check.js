const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');

(async () => {
  try {
    const endpoint = 'http://localhost:4566';
    const s3 = new S3Client({ region: 'us-east-1', endpoint, credentials: { accessKeyId: 'test', secretAccessKey: 'test' }, forcePathStyle: true });
    const ddb = new DynamoDBClient({ region: 'us-east-1', endpoint, credentials: { accessKeyId: 'test', secretAccessKey: 'test' } });

    for (const bucket of ['saree-gallery-tiles', 'saree-gallery-gallery', 'saree-gallery-bucket']) {
      try {
        const res = await s3.send(new ListObjectsV2Command({ Bucket: bucket }));
        console.log('BUCKET', bucket, (res.Contents || []).map((o) => o.Key));
      } catch (err) {
        console.error('bucket error', bucket, err.name || err.message);
      }
    }

    try {
      const resp = await ddb.send(new ScanCommand({ TableName: 'sarees' }));
      console.log('DYNAMO ITEMS', JSON.stringify(resp.Items || [], null, 2));
    } catch (err) {
      console.error('dynamo error', err.name || err.message);
    }
  } catch (err) {
    console.error('unexpected error', err);
  }
})();
