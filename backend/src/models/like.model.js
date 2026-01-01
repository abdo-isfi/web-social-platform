const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Thread',
      required: false,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

likeSchema.index({ user: 1, thread: 1, comment: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
