import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Blacklist from "../models/Blacklist.js";
import ChatRoom from "../models/ChatRoom.js";
import ChatMessage from "../models/ChatMessage.js";
import resolveChatRoom from "../utils/resolveChatRoom.js";
import authorizeChatRoomAccess from "../utils/authorizeChatRoomAccess.js";
import allowedOrigins from "../config/allowedOrigins.js";
import { allowSocketAction, clearSocketBuckets } from "../utils/socketRateLimiter.js";

const MAX_MESSAGE_LENGTH = 4000;
const CLOUDINARY_IMAGE_PREFIX = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`;

let ioInstance;

// REST controller'ların (article/userController) bildirim oluşturduktan sonra
// aynı Socket.IO instance'ına erişip canlı bir event yayınlayabilmesi için.
export const getIo = () => ioInstance;

export default function initChatSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins }
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
      // Sıkı değil — sadece bir client'ın her tuşta event basıp odayı
      // gereksiz yere meşgul etmesini önlüyor, aşımda sessizce yok sayılıyor.
      if (!allowSocketAction(socket.id, "typing", { max: 5, windowMs: 3000 })) return;

      socket.to(roomId).emit("typing", {
        roomId,
        user: { _id: socket.user._id, username: socket.user.username }
      });
    });

    socket.on("send_message", async ({ roomId, text, image }, callback) => {
      if (!allowSocketAction(socket.id, "send_message", { max: 15, windowMs: 10000 })) {
        return callback?.({ error: "Çok hızlı mesaj gönderiyorsunuz, biraz yavaşlayın." });
      }

      const trimmedText = text?.trim() || "";
      if (!trimmedText && !image) {
        return callback?.({ error: "Mesaj boş olamaz" });
      }
      if (trimmedText.length > MAX_MESSAGE_LENGTH) {
        return callback?.({ error: `Mesaj en fazla ${MAX_MESSAGE_LENGTH} karakter olabilir.` });
      }
      // image client'tan gelen serbest bir string — kendi Cloudinary
      // hesabımıza (uploadChatImage ile) yüklenmiş bir dosya olduğunu
      // doğrulamadan kaydedip yayınlamak, rastgele bir URL/uzun metin
      // enjekte edilmesine izin verirdi.
      if (image && !image.startsWith(CLOUDINARY_IMAGE_PREFIX)) {
        return callback?.({ error: "Geçersiz görsel." });
      }

      const room = await ChatRoom.findById(roomId);
      if (!room) return callback?.({ error: "Chat odası bulunamadı" });

      // Yetki join zamanında kontrol edildi, gönderim anında tekrar doğrulanıyor
      // (kullanıcı arada makaleyi kütüphaneden çıkarmış olabilir)
      const authResult = await authorizeChatRoomAccess(socket.user._id, room);
      if (!authResult.ok) return callback?.({ error: authResult.message });

      // Mesajlar artık ayrı bir koleksiyonda (bkz. models/ChatMessage.js) —
      // dashboard odası herkesin paylaştığı tek bir kayıt olduğu için embedded
      // bir dizi sınırsız büyür ve MongoDB'nin 16MB doküman limitine çarpardı.
      const savedMessage = await ChatMessage.create({
        room: roomId,
        sender: socket.user._id,
        text: trimmedText,
        image: image || undefined
      });

      const payload = {
        _id: savedMessage._id,
        roomId,
        sender: { _id: socket.user._id, username: socket.user.username, avatar: socket.user.avatar },
        text: savedMessage.text,
        image: savedMessage.image,
        createdAt: savedMessage.createdAt
      };

      io.to(roomId).emit("new_message", payload);

      // Direkt mesajlarda alıcı o an bu odaya join olmamış olabilir (örn. başka
      // bir sayfada) — kişisel odasına ayrıca gönderiyoruz ki bildirimi kaçırmasın.
      if (room.type === "direct") {
        const recipientId = room.members.find((m) => m.toString() !== socket.user._id.toString());
        if (recipientId) {
          io.to(`user:${recipientId}`).emit("direct_message", payload);
        }
      }

      callback?.({ success: true });
    });

    socket.on("disconnect", () => {
      clearSocketBuckets(socket.id);
    });
  });

  return io;
}