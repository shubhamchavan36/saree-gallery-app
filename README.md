This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## LocalStack development

This app is configured to use LocalStack for development with S3 and DynamoDB.

Create a `.env.local` file with these values:

```env
AWS_REGION=us-east-1
AWS_ENDPOINT=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET_NAME_TILE=saree-gallery-tiles
S3_BUCKET_NAME_GALLERY=saree-gallery-gallery
DYNAMODB_TABLE_NAME=sarees
LOCALSTACK_AUTH_TOKEN=ls-wApO9200-NoZe-keWi-zeqI-cUCOnaSE6254
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_SESSION_VALUE=saree-gallery-admin-auth
```

The `LOCALSTACK_AUTH_TOKEN` is only required by LocalStack startup, not by the app itself.

### Start LocalStack

Use Docker Compose to launch LocalStack:

```bash
LOCALSTACK_AUTH_TOKEN=ls-wApO9200-NoZe-keWi-zeqI-cUCOnaSE6254 \
  docker compose -f docker-compose.localstack.yml up
```

### Create the required resources

After LocalStack is running, create the buckets and table:

```bash
aws --endpoint-url=http://localhost:4566 s3 mb s3://saree-gallery-tiles
aws --endpoint-url=http://localhost:4566 s3 mb s3://saree-gallery-gallery

aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name sarees \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

> Note: the app now writes tile images to `saree-gallery-tiles` and gallery images to `saree-gallery-gallery` by default. If you still want a single bucket, set `S3_BUCKET_NAME` instead of the two separate bucket variables.

### Run the app

```bash
npm run dev
```

### Notes

- `AWS_ENDPOINT` points the app to LocalStack.
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` are only for the app’s AWS SDK calls.
- Use `test/test` for LocalStack credentials or any non-empty values when running on localhost.

## Deploy on AWS

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
