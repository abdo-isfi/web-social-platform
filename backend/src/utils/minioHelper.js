const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { minioClient, bucketName } = require('../config/minio');
const envVar = require('../config/EnvVariable');

/**
 * MinIO Helper Utilities
 * 
 * Provides utility functions for MinIO operations including:
 * - File uploads with streaming
 * - Presigned URL generation
 * - Object deletion
 * - Unique filename generation
 */

/**
 * Generate a unique, collision-safe filename
 * 
 * @param {string} originalName - Original filename with extension
 * @returns {string} UUID-based filename with original extension
 * 
 * @example
 * generateUniqueFileName('video.mp4') // => '550e8400-e29b-41d4-a716-446655440000.mp4'
 */
function generateUniqueFileName(originalName) {
  const ext = path.extname(originalName);
  const uniqueName = `${uuidv4()}${ext}`;
  return uniqueName;
}

/**
 * Upload a file to MinIO using streaming
 * 
 * This function uploads a file from the local filesystem to MinIO.
 * After successful upload, the temporary file is deleted.
 * 
 * @param {string} filePath - Absolute path to the file to upload
 * @param {string} fileName - Desired object name in MinIO (should be unique)
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<{key: string, url: string}>} Object key and presigned URL
 * @throws {Error} If upload fails
 */
async function uploadToMinIO(filePath, fileName, contentType) {
  try {
    const metaData = {
      'Content-Type': contentType,
    };

    // Upload file to MinIO
    await minioClient.fPutObject(bucketName, fileName, filePath, metaData);

    console.log(`✓ File uploaded to MinIO: ${fileName}`);

    // Generate presigned URL for access (valid for 24 hours)
    const presignedUrl = await generatePresignedUrl(fileName, 24 * 60 * 60);

    // Delete temporary file after successful upload
    try {
      await fs.unlink(filePath);
      console.log(`✓ Temporary file deleted: ${filePath}`);
    } catch (unlinkError) {
      console.warn(`⚠ Failed to delete temporary file: ${filePath}`, unlinkError.message);
      // Don't throw - upload was successful, cleanup failure is non-critical
    }

    return {
      key: fileName,
      url: presignedUrl,
    };
  } catch (error) {
    console.error(`✗ MinIO upload failed for ${fileName}:`, error.message);
    
    // Attempt to clean up temporary file even on upload failure
    try {
      await fs.unlink(filePath);
    } catch (unlinkError) {
      // Ignore cleanup errors
    }

    throw new Error(`Failed to upload file to MinIO: ${error.message}`);
  }
}

/**
 * Generate a presigned URL for accessing a MinIO object
 * 
 * Presigned URLs provide temporary, secure access to private objects.
 * The URL includes authentication parameters and expires after the specified duration.
 * 
 * @param {string} objectKey - MinIO object key (filename)
 * @param {number} expirySeconds - URL expiry time in seconds (default: 24 hours)
 * @returns {Promise<string>} Presigned URL
 * @throws {Error} If URL generation fails
 */
async function generatePresignedUrl(objectKey, expirySeconds = 24 * 60 * 60) {
  try {
    const presignedUrl = await minioClient.presignedGetObject(
      bucketName,
      objectKey,
      expirySeconds
    );
    return presignedUrl;
  } catch (error) {
    console.error(`✗ Failed to generate presigned URL for ${objectKey}:`, error.message);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
}

/**
 * Delete an object from MinIO
 * 
 * Used when updating or deleting media from threads.
 * 
 * @param {string} objectKey - MinIO object key to delete
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails
 */
async function deleteFromMinIO(objectKey) {
  try {
    await minioClient.removeObject(bucketName, objectKey);
    console.log(`✓ Object deleted from MinIO: ${objectKey}`);
  } catch (error) {
    console.error(`✗ Failed to delete object from MinIO: ${objectKey}:`, error.message);
    throw new Error(`Failed to delete object from MinIO: ${error.message}`);
  }
}

/**
 * Refresh presigned URL for an existing object
 * 
 * Useful for returning fresh URLs when fetching threads from the database.
 * Since presigned URLs expire, we regenerate them on each request.
 * 
 * @param {string} objectKey - MinIO object key
 * @returns {Promise<string>} Fresh presigned URL
 */
async function refreshPresignedUrl(objectKey) {
  return generatePresignedUrl(objectKey);
}

module.exports = {
  generateUniqueFileName,
  uploadToMinIO,
  generatePresignedUrl,
  deleteFromMinIO,
  refreshPresignedUrl,
};
