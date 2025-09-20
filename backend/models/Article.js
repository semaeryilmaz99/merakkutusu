const ArticleSchema = new mongoose.Schema({
    title: {type: String, required: true},
    content: {type: String, required: true},
    image: {type: String}, // Cloudinary url
    author: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    likes: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    favorites: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    tags: [String]
}, {timestamps: true});