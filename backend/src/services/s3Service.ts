import fs from 'fs';
import path from 'path';

export interface UploadResult {
  url: string;
  provider: 'AWS_S3' | 'LOCAL';
  key: string;
}

/**
 * Uploads a product image buffer/base64 to AWS S3 if credentials are provided,
 * or safely falls back to local storage if running without paid AWS credentials.
 */
export const uploadProductImage = async (
  fileName: string,
  buffer: Buffer,
  contentType: string = 'image/jpeg'
): Promise<UploadResult> => {
  const bucket = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION || 'ap-south-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  const key = `products/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  // If AWS S3 credentials are configured in environment variables
  if (bucket && accessKeyId && secretAccessKey) {
    try {
      // Dynamic import of AWS S3 SDK if available
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      const s3 = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );

      const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
      console.log(`☁️ Product image uploaded to AWS S3: ${s3Url}`);
      return { url: s3Url, provider: 'AWS_S3', key };
    } catch (s3Error) {
      console.warn('⚠️ AWS S3 upload failed or SDK not installed, falling back to local storage:', s3Error);
    }
  }

  // Fallback: Local static storage
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const localPath = path.join(uploadDir, path.basename(key));
  fs.writeFileSync(localPath, buffer);

  const localUrl = `/uploads/${path.basename(key)}`;
  console.log(`📁 Product image saved to local storage: ${localUrl}`);
  return { url: localUrl, provider: 'LOCAL', key };
};
