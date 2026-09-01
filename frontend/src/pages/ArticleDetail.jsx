import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart, Library, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getArticleById,
  toggleFavorite,
  toggleLibrary,
  addComment,
  getMyLibrary,
} from "../services/articleService";

export default function ArticleDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([getArticleById(id), getMyLibrary()])
      .then(([articleData, library]) => {
        setArticle(articleData);
        setIsFavorite(articleData.favorites?.includes(user?._id));
        setIsInLibrary(library.some((a) => a._id === articleData._id));
      })
      .finally(() => setIsLoading(false));
  }, [id, user?._id]);

  const handleToggleFavorite = async () => {
    setIsFavorite((prev) => !prev);
    await toggleFavorite(id);
  };

  const handleToggleLibrary = async () => {
    setIsInLibrary((prev) => !prev);
    await toggleLibrary(id);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const comments = await addComment(id, commentText.trim());
      setArticle((prev) => ({ ...prev, comments }));
      setCommentText("");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500">Yükleniyor...</p>;
  }

  if (!article) {
    return <p className="text-sm text-accent-coral">Makale bulunamadı.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-2xl border-2 border-teal-500 bg-white">
        <div className="flex items-center justify-between gap-3 bg-gray-100 px-4 py-3">
          <h1 className="truncate text-lg font-semibold text-brand-900">{article.title}</h1>
          <Link
            to={`/users/${article.author?._id}`}
            className="flex-none rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 hover:underline"
          >
            {article.author?.username}
          </Link>
        </div>

        {article.image && (
          <img src={article.image} alt={article.title} className="max-h-96 w-full object-cover" />
        )}

        <div className="max-h-96 overflow-y-auto whitespace-pre-wrap p-4 text-sm text-brand-900">
          {article.content}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-100 p-4">
          <div className="flex flex-wrap gap-2">
            {(article.tags || []).map((tag) => (
              <span
                key={tag._id || tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-brand-800"
              >
                #{tag.name || tag}
              </span>
            ))}
          </div>

          <div className="flex flex-none gap-2">
            <button
              onClick={handleToggleLibrary}
              aria-label="Kütüphaneye ekle/çıkar"
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                isInLibrary ? "bg-brand-600 text-white" : "bg-gray-100 text-brand-700"
              }`}
            >
              <Library size={16} />
            </button>
            <button
              onClick={handleToggleFavorite}
              aria-label="Favorilere ekle/çıkar"
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                isFavorite ? "bg-accent-coral text-white" : "bg-gray-100 text-brand-700"
              }`}
            >
              <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleAddComment} className="mt-4 flex items-center gap-2 rounded-2xl bg-gray-700 p-3">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add your comment in this area..."
          className="flex-1 rounded-full bg-white px-4 py-2 text-sm text-brand-900 outline-none"
        />
        <button
          type="submit"
          disabled={isSubmittingComment}
          aria-label="Yorum gönder"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
        >
          <Send size={16} />
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-gray-700 p-4">
        {(article.comments || []).length === 0 ? (
          <p className="text-sm text-white/70">Henüz yorum yok.</p>
        ) : (
          [...article.comments].reverse().map((comment) => (
            <div key={comment._id} className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent-gold text-xs font-bold text-brand-900">
                {comment.user?.username?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="rounded-xl bg-white px-3 py-2 text-sm text-brand-900">
                <p className="mb-1 text-xs font-semibold text-brand-700">
                  {comment.user?.username || "kullanıcı"}
                </p>
                {comment.text}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
