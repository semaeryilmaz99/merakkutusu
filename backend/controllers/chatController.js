import ChatRoom from "../models/ChatRoom.js";
import asyncHandler from "../utils/asyncHandler.js";
import resolveChatRoom from "../utils/resolveChatRoom.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import authorizeChatRoomAccess from "../utils/authorizeChatRoomAccess.js";

// Dashboard (global) chat odasını getirir/oluşturur
export const getOrCreateDashboardRoom = asyncHandler(async (req, res) => {
    const { room, error } = await resolveChatRoom({ type: "dashboard" });
    if (error) return res.status(error.status).json({ message: error.message });
    res.json({ roomId: room._id });
});

// Makaleye özel chat odasını getirir/oluşturur (sadece kütüphanesinde olanlar)
export const getOrCreateArticleRoom = asyncHandler(async (req, res) => {
    const { room, error } = await resolveChatRoom({
      type: "article",
      userId: req.user._id,
      articleId: req.params.articleId
    });
    if (error) return res.status(error.status).json({ message: error.message });
    res.json({ roomId: room._id });
});

// İki kullanıcı arası direkt chat odasını getirir/oluşturur
export const getOrCreateDirectRoom = asyncHandler(async (req, res) => {
    const { room, error } = await resolveChatRoom({
      type: "direct",
      userId: req.user._id,
      targetUserId: req.params.userId
    });
    if (error) return res.status(error.status).json({ message: error.message });
    res.json({ roomId: room._id });
});

// Chat'e görsel/GIF mesajı için Cloudinary'ye yükleme
export const uploadChatImage = asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "Görsel gereklidir" });

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "merakkutusu_chat",
      quality: "auto",
      fetch_format: "auto"
    });

    res.json({ url: result.secure_url });
});

// Bir odanın mesaj geçmişini getirir
export const getRoomMessages = asyncHandler(async (req, res) => {
    const room = await ChatRoom.findById(req.params.roomId)
      .populate("messages.sender", "username avatar");

    if (!room) return res.status(404).json({ message: "Chat odası bulunamadı" });

    const authResult = await authorizeChatRoomAccess(req.user._id, room);
    if (!authResult.ok) return res.status(403).json({ message: authResult.message });

    res.json(room.messages);
});