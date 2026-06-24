import { randomUUID } from "crypto";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import {
  DynamoDBClient,
  DescribeTableCommand,
  CreateTableCommand,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { SareeImage, SareeItem, SareeStatus } from "@/types/saree";

function getRequiredEnv(name: string): string {
  const raw = process.env[name]?.trim();
  if (!raw) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return raw;
}

function resolveAwsRegion(): string {
  return process.env.AWS_REGION?.trim() || "us-east-1";
}

function resolveAwsEndpoint(): string | undefined {
  const explicit = process.env.AWS_ENDPOINT?.trim();
  if (explicit) return explicit;
  return process.env.NODE_ENV !== "production" ? "http://localhost:4566" : undefined;
}

function resolveAwsCredentials() {
  const accessKey = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const endpoint = resolveAwsEndpoint();

  if (accessKey && secretKey) {
    return { accessKeyId: accessKey, secretAccessKey: secretKey };
  }

  if (endpoint?.includes("localhost")) {
    return {
      accessKeyId: accessKey || "test",
      secretAccessKey: secretKey || "test",
    };
  }

  return undefined;
}

function isLocalStack(): boolean {
  const endpoint = resolveAwsEndpoint();
  return Boolean(endpoint && endpoint.includes("localhost"));
}

function getS3TileBucketName(): string {
  return (
    process.env.S3_BUCKET_NAME_TILE?.trim() ||
    process.env.S3_BUCKET_NAME?.trim() ||
    (isLocalStack() ? "saree-gallery-tiles" : getRequiredEnv("S3_BUCKET_NAME"))
  );
}

function getS3GalleryBucketName(): string {
  return (
    process.env.S3_BUCKET_NAME_GALLERY?.trim() ||
    process.env.S3_BUCKET_NAME?.trim() ||
    (isLocalStack() ? "saree-gallery-gallery" : getRequiredEnv("S3_BUCKET_NAME"))
  );
}

function getDynamoTableName(): string {
  if (isLocalStack()) {
    return process.env.DYNAMODB_TABLE_NAME?.trim() || "sarees";
  }
  return getRequiredEnv("DYNAMODB_TABLE_NAME");
}

let s3Client: S3Client | undefined;
let localResourcesEnsured = false;

async function ensureBucketExists(bucket: string): Promise<void> {
  const client = getS3Client();

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return;
  } catch (error: unknown) {
    const message = error && typeof error === "object" && "name" in error ? (error as { name?: string }).name : undefined;
    if (message && message !== "NotFound" && message !== "NoSuchBucket") {
      throw error;
    }
  }

  await client.send(new CreateBucketCommand({ Bucket: bucket }));
}

async function ensureDynamoTable(): Promise<void> {
  const tableName = getDynamoTableName();
  const client = getDynamoClient();

  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return;
  } catch (error: unknown) {
    const message = error && typeof error === "object" && "name" in error ? (error as { name?: string }).name : undefined;
    if (message && message !== "ResourceNotFoundException" && message !== "ValidationException") {
      throw error;
    }
  }

  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
      KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    })
  );
}

async function ensureLocalstackResources(): Promise<void> {
  if (!isLocalStack() || localResourcesEnsured) return;
  await ensureBucketExists(getS3TileBucketName());
  await ensureBucketExists(getS3GalleryBucketName());
  await ensureDynamoTable();
  localResourcesEnsured = true;
}

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: resolveAwsRegion(),
      endpoint: resolveAwsEndpoint(),
      credentials: resolveAwsCredentials(),
      forcePathStyle: Boolean(resolveAwsEndpoint()),
      maxAttempts: 3,
    });
  }
  return s3Client;
}

let dynamoClient: DynamoDBDocumentClient | undefined;
function getDynamoClient(): DynamoDBDocumentClient {
  if (!dynamoClient) {
    const client = new DynamoDBClient({
      region: resolveAwsRegion(),
      endpoint: resolveAwsEndpoint(),
      credentials: resolveAwsCredentials(),
      maxAttempts: 3,
    });
    dynamoClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return dynamoClient;
}

function sanitizeFileName(value: string): string {
  const ext = value.includes(".") ? value.slice(value.lastIndexOf(".")) : "";
  const base = value
    .slice(0, value.lastIndexOf("."))
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${base || "upload"}-${Date.now()}${ext || ".jpg"}`;
}

function getS3ObjectUrl(bucket: string, key: string): string {
  const endpoint = resolveAwsEndpoint();
  if (endpoint) {
    const normalized = endpoint.replace(/\/+$/, "");
    return `${normalized}/${bucket}/${encodeURIComponent(key)}`;
  }
  const region = resolveAwsRegion();
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
}

function getS3Bucket(bucketType: "tile" | "gallery" = "gallery"): string {
  return bucketType === "tile" ? getS3TileBucketName() : getS3GalleryBucketName();
}

function getBucketAndKeyFromUrl(url: string): { bucket: string; key: string } | null {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\/+/, "");
    const possibleBuckets = [getS3TileBucketName(), getS3GalleryBucketName()];

    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      for (const bucket of possibleBuckets) {
        if (path.startsWith(`${bucket}/`)) {
          return { bucket, key: decodeURIComponent(path.slice(bucket.length + 1)) };
        }
      }
      return { bucket: getS3GalleryBucketName(), key: decodeURIComponent(path) };
    }

    const hostMatch = parsed.hostname.match(/^(.+)\.s3\./);
    if (hostMatch) {
      return { bucket: hostMatch[1], key: decodeURIComponent(path) };
    }

    return { bucket: getS3GalleryBucketName(), key: decodeURIComponent(path) };
  } catch {
    return null;
  }
}

export function normalizeBlobUrl(url: string): string {
  return url.trim();
}

export function normalizeStatus(input: string | null | undefined): SareeStatus {
  return input === "sold_out" ? "sold_out" : "available";
}

function normalizeSareeImage(input: unknown): SareeImage | null {
  if (typeof input === "string" && input.trim()) {
    return { url: normalizeBlobUrl(input.trim()), status: "available" };
  }

  if (input && typeof input === "object") {
    const maybe = input as { url?: unknown; status?: unknown };
    if (typeof maybe.url === "string" && maybe.url.trim()) {
      return {
        url: normalizeBlobUrl(maybe.url.trim()),
        status: normalizeStatus(typeof maybe.status === "string" ? maybe.status : undefined),
      };
    }
  }

  return null;
}

function normalizeSareeUrls(item: SareeItem): SareeItem {
  const tileImage = normalizeBlobUrl(item.tileImage);
  const colors = Array.isArray(item.colors)
    ? item.colors.map((entry) => {
        const normalizedImages = Array.isArray(entry.images)
          ? entry.images
              .map((img) => normalizeSareeImage(img))
              .filter((img): img is SareeImage => Boolean(img))
          : [];

        const seen = new Set<string>();
        const images = normalizedImages
          .filter((img) => normalizeBlobUrl(img.url) !== tileImage)
          .filter((img) => {
            const key = normalizeBlobUrl(img.url);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

        return { ...entry, images };
      })
    : [];

  return {
    ...item,
    tileImage,
    colors,
  };
}

async function scanAllItems(): Promise<SareeItem[]> {
  await ensureLocalstackResources();
  const tableName = getDynamoTableName();
  const client = getDynamoClient();
  const results: SareeItem[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const response = await client.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: exclusiveStartKey,
      })
    );
    if (response.Items) {
      results.push(...(response.Items as SareeItem[]));
    }
    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return results;
}

export async function readSarees(): Promise<SareeItem[]> {
  const sarees = await scanAllItems();
  return sarees.map(normalizeSareeUrls);
}

export async function writeSarees(sarees: SareeItem[]) {
  await ensureLocalstackResources();
  const existing = await scanAllItems();
  const nextIds = new Set(sarees.map((item) => item.id));
  const deletes = existing.filter((item) => !nextIds.has(item.id));

  await Promise.all(
    deletes.map((item) =>
      getDynamoClient().send(
        new DeleteCommand({
          TableName: getDynamoTableName(),
          Key: { id: item.id },
        })
      )
    )
  );

  await Promise.all(
    sarees.map((item) =>
      getDynamoClient().send(
        new PutCommand({
          TableName: getDynamoTableName(),
          Item: normalizeSareeUrls(item),
        })
      )
    )
  );
}

export function makeId() {
  return randomUUID();
}

export async function saveUploadedFile(
  file: File | null,
  bucketType: "tile" | "gallery" = "gallery"
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  await ensureLocalstackResources();

  const bucket = getS3Bucket(bucketType);
  const key = sanitizeFileName(file.name);
  const body = Buffer.from(await file.arrayBuffer());

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: file.type || "application/octet-stream",
    })
  );

  return getS3ObjectUrl(bucket, key);
}

export function getSareeBlobUrls(item: SareeItem): string[] {
  const urls = new Set<string>();
  if (item.tileImage) {
    urls.add(item.tileImage);
  }

  if (Array.isArray(item.colors)) {
    item.colors.forEach((entry) => {
      entry.images.forEach((image) => {
        if (image?.url) {
          urls.add(image.url);
        }
      });
    });
  }

  return Array.from(urls);
}

export async function deleteBlobUrls(urls: string[]): Promise<void> {
  const bucketMap = new Map<string, string[]>();

  for (const url of urls) {
    const bucketAndKey = getBucketAndKeyFromUrl(url);
    if (!bucketAndKey?.key) continue;

    const existing = bucketMap.get(bucketAndKey.bucket) ?? [];
    existing.push(bucketAndKey.key);
    bucketMap.set(bucketAndKey.bucket, existing);
  }

  if (bucketMap.size === 0) return;

  await Promise.all(
    Array.from(bucketMap.entries()).map(([bucket, keys]) =>
      getS3Client().send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: keys.map((Key) => ({ Key })),
            Quiet: true,
          },
        })
      )
    )
  );
}
