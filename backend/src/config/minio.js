const Minio = require('minio');
const envVar = require('./EnvVariable');

/**
 * MinIO Client Configuration
 * 
 * Initializes the MinIO client using environment variables.
 * This client is used throughout the application for object storage operations.
 * 
 * Configuration:
 * - endPoint: MinIO server hostname (without protocol)
 * - port: MinIO server port (default: 9000)
 * - useSSL: Enable HTTPS for production environments
 * - accessKey: MinIO access credentials
 * - secretKey: MinIO secret credentials
 */
const minioClient = new Minio.Client({
  endPoint: envVar.MINIO_ENDPOINT,
  port: envVar.MINIO_PORT,
  useSSL: envVar.MINIO_USE_SSL,
  accessKey: envVar.MINIO_ROOT_USER,
  secretKey: envVar.MINIO_ROOT_PASSWORD,
});

/**
 * Validates MinIO connection by attempting to list buckets
 * This is called during server startup to fail fast if MinIO is unreachable
 * 
 * @returns {Promise<boolean>} True if connection is successful
 * @throws {Error} If MinIO is unreachable or credentials are invalid
 */
async function validateConnection() {
  try {
    await minioClient.listBuckets();
    console.log('✓ MinIO connection validated successfully');
    return true;
  } catch (error) {
    console.error('✗ MinIO connection failed:', error.message);
    throw new Error(`MinIO connection validation failed: ${error.message}`);
  }
}

module.exports = {
  minioClient,
  validateConnection,
  bucketName: envVar.MINIO_BUCKET,
};
