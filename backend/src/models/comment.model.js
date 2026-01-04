const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      required: true,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null
    },
    media: { // Keeping media structure for future-proofing or if comments support it
      mediaType: {
        type: String,
        enum: ["image", "video"],
      },
      url: String,
      key: String,
      contentType: String,
    },
    likesCount: { // Optional denormalization
        type: Number,
        default: 0
    }
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ thread: 1, createdAt: 1 });
commentSchema.index({ author: 1 });

module.exports = mongoose.model("Comment", commentSchema);
