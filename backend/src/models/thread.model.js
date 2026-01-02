const mongoose = require("mongoose");

const threadSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: false, // Changed from true to allow media-only posts
      trim: true,
    },

    media: {
      mediaType: {
        type: String,
        enum: ["image", "video"],
      },
        data: Buffer,   // Legacy: for existing embedded images
        url: String,    // MinIO presigned URL or legacy URL
        key: String,    // MinIO object key (for deletion and URL refresh)
        contentType: String,
    
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    parentThread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      default: null,
    },
    repostOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      default: null,
    },
    quoteOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      default: null,
    },
    hashtags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    mentions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search and performance
threadSchema.index({ content: 'text', hashtags: 'text' });
threadSchema.index({ author: 1, createdAt: -1 });
threadSchema.index({ repostOf: 1 });
threadSchema.index({ parentThread: 1 });

module.exports = mongoose.model("Thread", threadSchema);
