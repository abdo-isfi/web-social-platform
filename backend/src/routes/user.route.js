const express = require("express");
const router = express.Router();
const authenticate  = require("../middlewares/auth");
const userController=require("../controllers/user.controller");
const {updateProfile, getUserById}=userController;
const upload = require("../middlewares/avatarUpload"); 
router.patch(
  '/me',
  authenticate,
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  updateProfile
);

router.get('/suggestions', authenticate, userController.getSuggestions); // Uses authenticate middleware to get req.user.id
router.get('/:userId', getUserById);
router.get('/:userId/posts', userController.getUserPosts);

module.exports = router;
