import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.js";
import {
    getOrCreateDashboardRoom,
    getOrCreateArticleRoom,
    getOrCreateDirectRoom,
    getRoomMessages,
    uploadChatImage
} from "../controllers/chatController.js";

const router = express.Router();

router.post("/rooms/dashboard", protect, getOrCreateDashboardRoom);
router.post("/rooms/article/:articleId", protect, getOrCreateArticleRoom);
router.post("/rooms/direct/:userId", protect, getOrCreateDirectRoom);
router.get("/rooms/:roomId/messages", protect, getRoomMessages);
router.post("/upload", protect, upload.single("image"), uploadChatImage);

export default router;