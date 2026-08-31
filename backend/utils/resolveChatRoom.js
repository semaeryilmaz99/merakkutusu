import ChatRoom from "../models/ChatRoom.js";
import Article from "../models/Article.js";
import User from "../models/User.js";

// Oda tipine göre find-or-create + yetki kontrolü yapar.
// Hem REST controller (chatController.js) hem socket handler (chatSocket.js)
// aynı yetkilendirme mantığını kullansın diye tek yerde toplandı.
export default async function resolveChatRoom({ type, userId, articleId, targetUserId }) {
  if (type === "dashboard") {
    let room = await ChatRoom.findOne({ type: "dashboard" });
    if (!room) room = await ChatRoom.create({ type: "dashboard" });
    return { room };
  }

  if (type === "article") {
    if (!articleId) return { error: { status: 400, message: "articleId gereklidir" } };

    const article = await Article.findById(articleId);
    if (!article) return { error: { status: 404, message: "Makale bulunamadı" } };

    const user = await User.findById(userId).select("library");
    const inLibrary = user?.library?.some(id => id.toString() === articleId.toString());
    if (!inLibrary) {
      return { error: { status: 403, message: "Bu chat odasına erişmek için makaleyi kütüphanenize eklemelisiniz" } };
    }

    let room = await ChatRoom.findOne({ type: "article", article: articleId });
    if (!room) room = await ChatRoom.create({ type: "article", article: articleId });
    return { room };
  }

  if (type === "direct") {
    if (!targetUserId) return { error: { status: 400, message: "targetUserId gereklidir" } };
    if (targetUserId.toString() === userId.toString()) {
      return { error: { status: 400, message: "Kendinizle sohbet başlatamazsınız" } };
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return { error: { status: 404, message: "Kullanıcı bulunamadı" } };

    let room = await ChatRoom.findOne({
      type: "direct",
      members: { $all: [userId, targetUserId], $size: 2 }
    });
    if (!room) room = await ChatRoom.create({ type: "direct", members: [userId, targetUserId] });
    return { room };
  }

  return { error: { status: 400, message: "Geçersiz oda tipi" } };
}