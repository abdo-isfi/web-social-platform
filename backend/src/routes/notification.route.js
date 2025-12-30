const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { getUnreadNotifications, markAsRead, markAllAsRead } = require('../controllers/notification.controller');

router.get('/unread', authMiddleware, getUnreadNotifications);
router.put('/:notificationId/read', authMiddleware, markAsRead);
router.put('/read-all', authMiddleware, markAllAsRead);

module.exports = router;
