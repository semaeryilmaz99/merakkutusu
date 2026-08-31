import express from "express";
import {registerUser, loginUser, verifyUser, forgotPassword, resetPassword, logoutUser, refreshAccessToken} from "../controllers/authController.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import {
    registerValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    handleValidationErrors
} from "../middlewares/validators.js";

const router = express.Router();

router.post("/register", authLimiter, registerValidator, handleValidationErrors, registerUser);
router.post("/login", authLimiter, loginValidator, handleValidationErrors, loginUser);
router.get("/verify/:token", authLimiter, verifyUser);
router.post("/forgot-password", authLimiter, forgotPasswordValidator, handleValidationErrors, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPasswordValidator, handleValidationErrors, resetPassword);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);

export default router;
