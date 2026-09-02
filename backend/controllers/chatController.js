import ChatRoom from "../models/ChatRoom.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import resolveChatRoom from "../utils/resolveChatRoom.js";
import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";

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

    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "merakkutusu_chat", quality: "auto", fetch_format: "auto" },
        (err, res) => {
          if (err) return reject(err);
          resolve(res);
        }
      );
      bufferStream.pipe(stream);
    });

    res.json({ url: result.secure_url });
});

// Bir odanın mesaj geçmişini getirir
export const getRoomMessages = asyncHandler(async (req, res) => {
    const room = await ChatRoom.findById(req.params.roomId)
      .populate("messages.sender", "username avatar");

    if (!room) return res.status(404).json({ message: "Chat odası bulunamadı" });

    const userId = req.user._id.toString();

    if (room.type === "direct" && !room.members.some(m => m.toString() === userId)) {
      return res.status(403).json({ message: "Bu odaya erişim yetkiniz yok" });
    }

    if (room.type === "article") {
      const user = await User.findById(req.user._id).select("library");
      const inLibrary = user?.library?.some(id => id.toString() === room.article.toString());
      if (!inLibrary) {
        return res.status(403).json({ message: "Bu chat odasına erişmek için makaleyi kütüphanenize eklemelisiniz" });
      }
    }

    // type === "dashboard" için ek kontrol gerekmiyor, her giriş yapmış kullanıcı görebilir

    res.json(room.messages);
});