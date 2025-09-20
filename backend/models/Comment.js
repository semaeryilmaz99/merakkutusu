const CommentSchema = new mongoose.Schema({
    text: {type: String, required: true},
    article: {type: mongoose.Schema.Types.ObjectId, ref: "Article", required: true},
    author: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true}
}, {timestamps: true});