import mongoose from "mongoose";

const blacklistSchema = new mongoose.Schema({
    token: {type: String, required: true},
    createdAt: {type: Date, default: Date.now, expires: "7d"} // 7 gün sonra otomatik silinir
});

export default mongoose.model("Blacklist", blacklistSchema);