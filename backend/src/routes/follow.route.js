const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { sendFollowRequest , acceptFollowRequest, rejectFollowRequest, unfollowUser, getFollowers, getFollowing } = require('../controllers/follower.controller');

router.post('/follow', authMiddleware, sendFollowRequest);
router.patch('/accept', authMiddleware, acceptFollowRequest);
router.patch('/reject', authMiddleware, rejectFollowRequest);
router.get('/:userId/followers', authMiddleware, getFollowers);
router.get('/:userId/following', authMiddleware, getFollowing);
router.delete("/:userId", authMiddleware, unfollowUser);
module.exports = router;
