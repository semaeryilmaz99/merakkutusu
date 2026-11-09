import mongoose from "mongoose";

const ChatRoomSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["dashboard", "article", "direct"],
        required: true
    },
    article: { type: mongoose.Schema.Types.ObjectId, ref: "Article" }, // sadece type=article
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],  // sadece type=direct
    // Mesajların kendisi artık burada değil, ayrı ChatMessage koleksiyonunda
    // (bkz. models/ChatMessage.js) — dashboard odası TÜM kullanıcıların
    // paylaştığı tek bir kayıt olduğu için embedded bir dizi sınırsız büyür
    // ve MongoDB'nin 16MB doküman limitine çarpardı.
}, { timestamps: true });

const ChatRoom = mongoose.model("ChatRoom", ChatRoomSchema);
export default ChatRoom;