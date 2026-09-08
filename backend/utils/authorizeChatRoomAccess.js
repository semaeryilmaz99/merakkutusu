import User from "../models/User.js";

// Bir kullanıcının bir chat odasına erişim/mesaj gönderme yetkisi olup
// olmadığını kontrol eder — "direct" odalarda üye olma, "article" odalarda
// makaleyi kütüphanede bulundurma şartı. Bu kural (güvenlikle ilgili)
// hem REST (chatController.js getRoomMessages) hem Socket.IO
// (chatSocket.js send_message) tarafında bağımsız olarak, neredeyse
// birebir aynı şekilde ayrı ayrı yazılmıştı — biri değişip diğeri
// unutulursa sessiz bir yetkilendirme açığı oluşabilirdi.
export default async function authorizeChatRoomAccess(userId, room) {
  const userIdStr = userId.toString();

  if (room.type === "direct" && !room.members.some((m) => m.toString() === userIdStr)) {
    return { ok: false, message: "Bu odaya erişim yetkiniz yok." };
  }

  if (room.type === "article") {
    const user = await User.findById(userId).select("library");
    const inLibrary = user?.library?.some((id) => id.toString() === room.article.toString());
    if (!inLibrary) {
      return { ok: false, message: "Bu chat odasına erişmek için makaleyi kütüphanenize eklemelisiniz." };
    }
  }

  // type === "dashboard" için ek kontrol gerekmiyor, her giriş yapmış kullanıcı görebilir
  return { ok: true };
}
