import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true}, // kime gidecek
    type: {type: String, required: true, enum: ["comment", "like", "follow", "favorite"]},
    fromUser: {type: mongoose.Schema.Types.ObjectId, ref: "User"}, //Bildirimi tetikleyen kullanıcı
    article: {type: mongoose.Schema.Types.ObjectId, ref: "Article"}, // İlgili makale
    message: {type: String},
    isRead: {type: Boolean, default: false} // Okundu/okunmadı durumu
}, {timestamps: true});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;