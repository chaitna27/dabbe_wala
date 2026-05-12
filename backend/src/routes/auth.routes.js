const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/register", authController.register);
router.post("/login", authController.login);

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/reset-password/:token", authController.resetPassword);

router.get("/me", authMiddleware, authController.getMe);
router.patch("/me", authMiddleware, authController.patchMe);

module.exports = router;
