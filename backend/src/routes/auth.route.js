// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() }); 
const authController = require("../controllers/auth.controller");
const userSchema = require("../validators/userSchema");
const validateMiddleware=require("../middlewares/validate");
const authenticate = require("../middlewares/auth");

router.post("/register",   upload.fields([{ name: "avatar", maxCount: 1 },{ name: "banner", maxCount: 1 }]),validateMiddleware(userSchema.createUserSchema), authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.getCurrentUser);
module.exports = router;
