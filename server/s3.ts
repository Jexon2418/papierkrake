import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';
import config from './config';

// Create an S3 client with the same region as the KMS key
// KMS keys are region-specific, so we need to make sure the S3 client
// and the bucket are in the same region as the KMS key
const s3Client = new S3Client({
  region: config.storage.region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Environment-specific prefix from config
const S3_PREFIX = config.storage.prefix;

// Bucket name and configuration from config
const BUCKET_NAME = config.storage.bucket;
const KMS_KEY_ARN = config.storage.kmsKeyArn;
const URL_EXPIRY = config.storage.urlExpiry;
const MAX_FILE_SIZE = config.storage.maxFileSize;

// Valid file types
export const ALLOWED_FILE_TYPES = [
  'application/pdf', // PDF
  'image/jpeg',      // JPG, JPEG
  'image/png',       // PNG
  'image/gif',       // GIF
  'application/xml', // XML
  'application/msword', // DOC
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
];

// File extension mappings
export const FILE_EXTENSIONS = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'application/xml': '.xml',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

/**
 * Validates if a file type is allowed
 */
export function isFileTypeAllowed(contentType: string): boolean {
  return ALLOWED_FILE_TYPES.includes(contentType);
}

/**
 * Validates file size
 */
export function isFileSizeAllowed(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

/**
 * Generates a secure S3 key with user isolation and environment separation
 */
export function generateS3Key(originalFilename: string, userId: number, category?: string): string {
  const ext = path.extname(originalFilename).toLowerCase();
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  
  // Environment isolation: Use the environment-specific prefix
  // Format: users/{env}/{userId}/{category}/{timestamp}-{random}.{ext}
  return `${S3_PREFIX}${userId}/${category || 'documents'}/${timestamp}-${randomString}${ext}`;
}

/**
 * Uploads a file to S3 with server-side encryption
 */
export async function uploadFile(
  fileBuffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  // Validate file type
  if (!isFileTypeAllowed(contentType)) {
    throw new Error('File type not allowed');
  }
  
  // Validate file size
  if (!isFileSizeAllowed(fileBuffer.length)) {
    throw new Error('File exceeds maximum size of 50 MB');
  }
  
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
    // Server-side encryption using KMS
    ServerSideEncryption: "aws:kms" as const,
    SSEKMSKeyId: KMS_KEY_ARN,
  };

  await s3Client.send(new PutObjectCommand(params));
  return key;
}

/**
 * Generates a pre-signed URL for uploading a file directly to S3
 */
export async function getSignedUploadUrl(key: string, contentType: string): Promise<string> {
  if (!isFileTypeAllowed(contentType)) {
    throw new Error('File type not allowed');
  }
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ServerSideEncryption: "aws:kms" as const,
    SSEKMSKeyId: KMS_KEY_ARN,
  });

  return getSignedUrl(s3Client, command, { expiresIn: URL_EXPIRY });
}

/**
 * Generates a pre-signed URL for downloading a file
 */
export async function getSignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: URL_EXPIRY });
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

/**
 * Verify if the current user has access to this file
 * This ensures user isolation at the application level
 */
export function verifyUserFileAccess(userId: number, s3Key: string): boolean {
  // Check if the S3 key starts with the environment-specific prefix for this user
  const userPrefix = `${S3_PREFIX}${userId}/`;
  return s3Key.startsWith(userPrefix);
}
