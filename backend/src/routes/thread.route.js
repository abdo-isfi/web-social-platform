const express = require("express");
const router = express.Router();
const validate = require('../middlewares/validate');
const threadSchema=require("../validators/threadSchema");
const createThread = require("../controllers/thread.controller"); 
const commentController = require("../controllers/comment.controller");
const authMiddleware = require("../middlewares/auth");
const optionalAuth = require("../middlewares/optionalAuth");
const pagination=require("../middlewares/pagination");
const upload = require("../middlewares/avatarUpload"); 

router.post(
  "/",
  authMiddleware,         
  upload.single("media"), 
  validate(threadSchema),
  createThread.createThread
);
router.get('/me', authMiddleware, pagination, createThread.getUserThreads);
router.get('/bookmarks', authMiddleware, pagination, createThread.getBookmarkedThreads);
router.get('/me/:threadId', authMiddleware, createThread.getThreadById);
router.patch('/me/:threadId', authMiddleware,upload.single('file'), createThread.updateThread);
router.patch('/archive/:threadId', authMiddleware, createThread.archiveThread);

// Repost
router.post('/:threadId/repost', authMiddleware, createThread.repostThread);
router.delete('/:threadId/repost', authMiddleware, createThread.unrepostThread);

// Comments
router.get('/:threadId/comments', optionalAuth, pagination, commentController.getComments);
router.post('/:threadId/comments', authMiddleware, commentController.createComment);

// Bookmarks
router.post('/:threadId/bookmark', authMiddleware, createThread.bookmarkThread);
router.get('/user/bookmarks', authMiddleware, pagination, createThread.getBookmarkedThreads); // Using /user/bookmarks prefix to avoid conflict with :threadId if placed loosely, or just /bookmarks if :threadId is specific. 
// Wait, router.get('/:threadId'...) is defined earlier/later?
// router.get('/me', ...) is specific.
// router.get('/:threadId', ...) captures everything.
// SO: /bookmarks MUST come before /:threadId.

// Note: creating a comment is just creating a thread with parentThread, so we can use POST /  

// Feed
router.get('/', optionalAuth, pagination, createThread.getFeed); 
router.get('/public', pagination, createThread.getFeed); 

module.exports = router;
