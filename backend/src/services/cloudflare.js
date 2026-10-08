import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);

const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
const bucket = process.env.CLOUDFLARE_R2_BUCKET;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

export function createMediaKey(filename, type, timestamp = Date.now()) {
  const name =
    filename
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/\.{2,}/g, ".") || "media";
  return `media/${timestamp}-${name}`;
}

export function createPublicMediaUrl(baseUrl, key) {
  return new URL(key, `${baseUrl.replace(/\/+$/, "")}/`).toString();
}

export function validateMedia(file) {
  if (!file) throw new Error("Select an image or video");
  if (!ALLOWED_TYPES.has(file.mimetype)) {
    throw new Error(
      "Only JPG, PNG, WebP, GIF, MP4, and WebM files are supported",
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File must be 50 MB or smaller");
  }
}

export async function uploadMediaToCloudflare(file) {
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 is not configured");
  }
  validateMedia(file);

  const key = createMediaKey(file.originalname, file.mimetype);
  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    }),
  );

  return {
    url: createPublicMediaUrl(process.env.PUBLIC_MEDIA_BASE_URL, key),
    type: file.mimetype,
  };
}
