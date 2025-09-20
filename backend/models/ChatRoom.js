const ChatRoomSchema = new mongoose.Schema({
    members: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    messages: [{
        sender: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        text: String,
        createdAt: {type: Date, default: Date.now}
    }]
}, {timestamps: true});