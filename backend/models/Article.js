import mongoose from "mongoose";

const ArticleSchema = new mongoose.Schema({
    title: {type: String, required: true, trim: true},
    content: {type: String, required: true},
    image: {type: String}, // Cloudinary url
    author: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    favorites: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    comments: [
        {
            user: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
            text: {type: String, required: true},
            createdAt: {type: Date, default: Date.now}
        }
    ],
    tags: [String]
}, {timestamps: true});

const Article = mongoose.model("Article", ArticleSchema);
export default Article;