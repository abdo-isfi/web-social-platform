const multer = require("multer");
const path = require("path");
const fs = require("fs");

/**
 * Media Upload Middleware for Large Files
 * 
 * This middleware handles large media uploads (images and videos up to 200MB).
 * Uses disk storage to avoid memory exhaustion with large files.
 * 
 * Key differences from avatarUpload.js:
 * - Disk storage instead of memory storage
 * - 200MB limit instead of 200KB
 * - Accepts both images and videos
 * - Temporary files stored in uploads/ directory
 * 
 * Temporary files are automatically cleaned up after upload to MinIO.
 */

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✓ Created uploads directory:", uploadsDir);
}

// Configure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp to avoid collisions
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  console.log("Received file in media filter:", file.originalname);
  console.log("MIME type:", file.mimetype);

  if (!file) {
    return cb(new Error("No file received"));
  }

  // Accept both images and videos
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    console.log("Rejected file type:", file.mimetype);
    cb(new Error("Only image and video files are allowed"));
  }
};

// Export configured multer middleware
module.exports = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit
  },
  fileFilter: fileFilter,
});
