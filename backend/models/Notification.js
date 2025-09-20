const NotificationSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User"}, // kime gidecek
    type: {type: String, enum: ["comment", "like", "follow", "favorite"]},
    message: {type: String},
    isRead: {type: Boolean, default: false}
}, {timestamps: true});