const mongoose = require("mongoose");

const threadSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },

    media: {
      type: {
        type: String,
        enum: ["image", "video"],
      },
        data: Buffer,   
        url: String,    
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
