import express from "express";
import {protect} from "../middlewares/authMiddleware.js";
import {getNotifications, markAsRead} from "../controllers/notificationController.js";

const router = express.Router();

//Kullanıcıya ait bildirimleri getir
router.get("/", protect, getNotifications);

//Bildirimleri okundu olarak işaretleme 
router.put("/:id/read", protect, markAsRead);

export default router;