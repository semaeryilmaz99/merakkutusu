import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Blacklist from "../models/Blacklist.js";
import ChatRoom from "../models/ChatRoom.js";
import resolveChatRoom from "../utils/resolveChatRoom.js";

let ioInstance;

// REST controller'ların (article/userController) bildirim oluşturduktan sonra
// aynı Socket.IO instance'ına erişip canlı bir event yayınlayabilmesi için.
export const getIo = () => ioInstance;

export default function initChatSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });
  ioInstance = io;

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
    // Kişisel bildirim odası — direkt mesaj bildirimi almak için o odaya
    // ayrıca join olmuş olmak gerekmesin diye her bağlantıda otomatik katılır.
    socket.join(`user:${socket.user._id}`);

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

    socket.on("typing", ({ roomId }) => {
      socket.to(roomId).emit("typing", {
        roomId,
        user: { _id: socket.user._id, username: socket.user.username }
      });
    });

    socket.on("send_message", async ({ roomId, text, image }, callback) => {
      if (!text?.trim() && !image) {
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
        text: text?.trim() || "",
        image: image || undefined,
        createdAt: new Date()
      };

      room.messages.push(message);
      await room.save();

      const payload = {
        roomId,
        sender: { _id: socket.user._id, username: socket.user.username, avatar: socket.user.avatar },
        text: message.text,
        image: message.image,
        createdAt: message.createdAt
      };

      io.to(roomId).emit("new_message", payload);

      // Direkt mesajlarda alıcı o an bu odaya join olmamış olabilir (örn. başka
      // bir sayfada) — kişisel odasına ayrıca gönderiyoruz ki bildirimi kaçırmasın.
      if (room.type === "direct") {
        const recipientId = room.members.find(m => m.toString() !== userId);
        if (recipientId) {
          io.to(`user:${recipientId}`).emit("direct_message", payload);
        }
      }

      callback?.({ success: true });
    });
  });

  return io;
}