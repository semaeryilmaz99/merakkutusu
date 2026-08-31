import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Blacklist from "../models/Blacklist.js";
import ChatRoom from "../models/ChatRoom.js";
import resolveChatRoom from "../utils/resolveChatRoom.js";

export default function initChatSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  // protect middleware'inin JWT doğrulama mantığına paralel socket auth
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("Token gereklidir"));

      const blacklisted = await Blacklist.findOne({ token });
      if (blacklisted) return next(new Error("Token geçersiz, çıkış yapılmış."));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("Kullanıcı bulunamadı."));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Token geçersiz veya süresi dolmuş."));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join_room", async ({ type, articleId, targetUserId }, callback) => {
      const { room, error } = await resolveChatRoom({
        type,
        userId: socket.user._id,
        articleId,
        targetUserId
      });

      if (error) return callback?.({ error: error.message });

      socket.join(room._id.toString());
      callback?.({ roomId: room._id });
    });

    socket.on("send_message", async ({ roomId, text }, callback) => {
      if (!text || !text.trim()) {
        return callback?.({ error: "Mesaj boş olamaz" });
      }

      const room = await ChatRoom.findById(roomId);
      if (!room) return callback?.({ error: "Chat odası bulunamadı" });

      const userId = socket.user._id.toString();

      // Yetki join zamanında kontrol edildi, gönderim anında tekrar doğrulanıyor
      // (kullanıcı arada makaleyi kütüphaneden çıkarmış olabilir)
      if (room.type === "direct" && !room.members.some(m => m.toString() === userId)) {
        return callback?.({ error: "Bu odaya mesaj gönderme yetkiniz yok" });
      }

      if (room.type === "article") {
        const user = await User.findById(socket.user._id).select("library");
        const inLibrary = user?.library?.some(id => id.toString() === room.article.toString());
        if (!inLibrary) {
          return callback?.({ error: "Bu chat odasına mesaj göndermek için makaleyi kütüphanenize eklemelisiniz" });
        }
      }

      const message = {
        sender: socket.user._id,
        text: text.trim(),
        createdAt: new Date()
      };

      room.messages.push(message);
      await room.save();

      io.to(roomId).emit("new_message", {
        roomId,
        sender: { _id: socket.user._id, username: socket.user.username },
        text: message.text,
        createdAt: message.createdAt
      });

      callback?.({ success: true });
    });
  });

  return io;
}