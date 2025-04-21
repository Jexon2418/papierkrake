import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

// Create an S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Bucket name
const BUCKET_NAME = process.env.S3_BUCKET || 'papierkraken-docs';

/**
 * Generates a unique filename for S3 storage
 */
export function generateS3Key(originalFilename: string, userId: number, category?: string): string {
  const ext = path.extname(originalFilename);
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  
  let prefix = 'documents';
  if (category) {
    prefix = category.toLowerCase();
  }
  
  return `${prefix}/${userId}/${timestamp}-${randomString}${ext}`;
}

/**
 * Uploads a file to S3
 */
export async function uploadFile(
  fileBuffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  };

  await s3Client.send(new PutObjectCommand(params));
  return key;
}

/**
 * Generates a signed URL for downloading a file
 */
export async function getSignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
}

/**
 * Deletes a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  };

  await s3Client.send(new DeleteObjectCommand(params));
}
