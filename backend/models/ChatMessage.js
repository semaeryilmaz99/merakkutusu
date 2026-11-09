import mongoose from "mongoose";

// Önceden mesajlar ChatRoom.messages içinde embedded bir dizideydi — dashboard
// odası TÜM kullanıcıların paylaştığı TEK bir kayıt olduğu için bu dizi
// sınırsız büyüyor, eninde sonunda MongoDB'nin 16MB doküman limitine çarpıyordu,
// ayrıca her oda açılışında mesajların TAMAMI tek seferde çekiliyordu. Ayrı bir
// koleksiyona taşımak hem gerçek sayfalamayı (skip/limit, indeksli sorgu) hem de
// odanın kendisinin sabit boyutta kalmasını sağlıyor.
const ChatMessageSchema = new mongoose.Schema({
    room: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "", maxlength: 4000 },
    image: { type: String } // Cloudinary url
}, { timestamps: true });

// Bir odanın mesaj geçmişini en yeniden eskiye sayfalı çekmek için
ChatMessageSchema.index({ room: 1, createdAt: -1 });

const ChatMessage = mongoose.model("ChatMessage", ChatMessageSchema);
export default ChatMessage;
