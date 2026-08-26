import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";

// Kullanıcıya ait tüm bildirimleri getir
export const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({user: req.user._id})
    .sort({createdAt: -1})
    .populate("fromUser", "username email")
    .populate("article", "title");
    res.json(notifications);
});

// Bildirimi okundu olarak işaretleme
export const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({message: "Bildirim bulunamadı."});

    if(!notification.user.equals(req.user._id)) {
        return res.status(403).json({message: "Yetkiniz yok."});
    }

    notification.isRead = true;
    await notification.save();
    res.json({message: "Bildirim okundu."});
});
