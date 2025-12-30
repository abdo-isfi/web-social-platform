const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { likeThread , unlikeThread , getUserLikedThreads } = require('../controllers/like.controller');
const pagination = require('../middlewares/pagination');

router.post('/:threadId/like', authMiddleware, likeThread);
router.delete('/:threadId/unlike', authMiddleware, unlikeThread);
router.get('/likedthread',pagination, authMiddleware, getUserLikedThreads);
module.exports = router;
