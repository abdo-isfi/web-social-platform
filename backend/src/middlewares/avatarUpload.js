const multer = require("multer");

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 },
  fileFilter: (req, file, cb) => {
    console.log("Received file in filter:", file); 
    console.log("Content-Type header:", req.headers['content-type']);

    if (!file) {
      return cb(new Error("No file received"));
    }

    if (!file.mimetype.startsWith("image/")) {
      console.log("Rejected file type:", file.mimetype);
      return cb(new Error("Only image files are allowed"));
    }

    cb(null, true);
  }
});
