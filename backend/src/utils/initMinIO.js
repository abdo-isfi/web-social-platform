const { minioClient, validateConnection, bucketName } = require('../config/minio');

/**
 * Initialize MinIO Bucket
 * 
 * This function is called during server startup to ensure the configured bucket exists.
 * If the bucket doesn't exist, it will be created with appropriate policies.
 * 
 * Bucket Policy:
 * - Private bucket (default)
 * - Access via presigned URLs only
 * - No public read/write access
 * 
 * @returns {Promise<void>}
 * @throws {Error} If MinIO is unreachable or bucket operations fail
 */
async function initMinIO() {
  try {
    console.log(`Initializing MinIO bucket: ${bucketName}...`);

    // Validate MinIO connection first
    await validateConnection();

    // Check if bucket exists
    const bucketExists = await minioClient.bucketExists(bucketName);

    if (bucketExists) {
      console.log(`✓ MinIO bucket '${bucketName}' already exists`);
    } else {
      // Create bucket if it doesn't exist
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`✓ MinIO bucket '${bucketName}' created successfully`);

      // Set bucket policy for presigned URL access
      // Private bucket - access only via presigned URLs
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
            Condition: {
              StringEquals: {
                's3:signatureversion': 'AWS4-HMAC-SHA256'
              }
            }
          }
        ]
      };

      // Note: For presigned URLs to work, we don't need to set a public policy
      // The bucket remains private, and presigned URLs provide temporary access
      console.log(`✓ MinIO bucket '${bucketName}' configured for presigned URL access`);
    }

    console.log('✓ MinIO initialization completed successfully');
  } catch (error) {
    console.error('✗ MinIO initialization failed:', error.message);
    console.error('Please ensure MinIO is running and credentials are correct');
    throw new Error(`MinIO initialization failed: ${error.message}`);
  }
}

module.exports = initMinIO;
