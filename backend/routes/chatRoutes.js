import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    getOrCreateDashboardRoom,
    getOrCreateArticleRoom,
    getOrCreateDirectRoom,
    getRoomMessages
} from "../controllers/chatController.js";

const router = express.Router();

router.post("/rooms/dashboard", protect, getOrCreateDashboardRoom);
router.post("/rooms/article/:articleId", protect, getOrCreateArticleRoom);
router.post("/rooms/direct/:userId", protect, getOrCreateDirectRoom);
router.get("/rooms/:roomId/messages", protect, getRoomMessages);

export default router;