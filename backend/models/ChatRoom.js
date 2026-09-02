import mongoose from "mongoose";

const ChatRoomSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["dashboard", "article", "direct"],
        required: true
    },
    article: { type: mongoose.Schema.Types.ObjectId, ref: "Article" }, // sadece type=article
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],  // sadece type=direct
    messages: [
        {
            sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            text: { type: String, default: "" },
            image: { type: String }, // Cloudinary url — görsel/GIF mesajları
            createdAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

const ChatRoom = mongoose.model("ChatRoom", ChatRoomSchema);
export default ChatRoom;