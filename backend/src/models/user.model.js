const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 30
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 30
  },
  name: {
    type: String,
    trim: true,
    default: '',
    maxlength: 60
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 160,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    maxlength: 30,
    default: ''
  },
  website: {
    type: String,
    trim: true,
    maxlength: 100,
    default: ''
  },
  birthday: {
    type: String,
    default: ''
  },
  avatar: {
    url: String,
    key: String
  },
  avatarType: {
    type: String,
    default: null
  },
  banner: {
    url: String,
    key: String
  },
  bannerType: {
    type: String,
    default: null
  },
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Thread'
  }],
  followersCount: {
    type: Number,
    default: 0
  },
  followingCount: {
    type: Number,
    default: 0
  },
  refreshToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Text index for user search
userSchema.index({ name: 'text', username: 'text', firstName: 'text', lastName: 'text', email: 'text' });

const User = mongoose.model('User', userSchema);
module.exports = User;
