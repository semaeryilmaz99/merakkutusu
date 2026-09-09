import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Heart, Library, Pencil, Send, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "../context/AuthContext";
import {
  getArticleById,
  toggleFavorite,
  toggleLibrary,
  addComment,
  updateComment,
  deleteComment,
  getMyLibrary,
  deleteArticle,
} from "../services/articleService";
import { formatFullDate } from "../utils/formatDate";
import SproutCelebration from "../components/SproutCelebration";
import ArticleFormModal from "../components/ArticleFormModal";

export default function ArticleDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingArticle, setIsEditingArticle] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [actionError, setActionError] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  useEffect(() => {
    // PublicProfile.jsx'teki aynı race: id hızlıca değişirse (başka bir
    // makaleye link'ten geçiş) eski isteğin geç gelen cevabı yeni makalenin
    // üzerine yazabilirdi — "ignore" bayrağıyla geç gelen cevap yok sayılıyor.
    let ignore = false;

    setIsLoading(true);
    Promise.all([getArticleById(id), getMyLibrary()])
      .then(([articleData, library]) => {
        if (ignore) return;
        setArticle(articleData);
        setIsFavorite(articleData.favorites?.includes(user?._id));
        setIsInLibrary(library.some((a) => a._id === articleData._id));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, user?._id]);

  useEffect(() => {
    if (!actionError) return;
    const timeout = setTimeout(() => setActionError(""), 3000);
    return () => clearTimeout(timeout);
  }, [actionError]);

  const handleToggleFavorite = async () => {
    const previouslyFavorite = isFavorite;
    setIsFavorite(!previouslyFavorite);
    try {
      await toggleFavorite(id);
    } catch {
      setIsFavorite(previouslyFavorite);
      setActionError("Favori durumu güncellenemedi, tekrar dene.");
    }
  };

  const handleToggleLibrary = async () => {
    const previouslyInLibrary = isInLibrary;
    const next = !previouslyInLibrary;
    setIsInLibrary(next);
    try {
      await toggleLibrary(id);
      window.dispatchEvent(new CustomEvent("library:changed", { detail: { articleId: id, isInLibrary: next } }));
    } catch {
      setIsInLibrary(previouslyInLibrary);
      setActionError("Kütüphane durumu güncellenemedi, tekrar dene.");
    }
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

  const handleStartEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditingCommentText(comment.text);
  };

  const handleSaveComment = async (commentId) => {
    if (!editingCommentText.trim()) return;
    try {
      const comments = await updateComment(id, commentId, editingCommentText.trim());
      setArticle((prev) => ({ ...prev, comments }));
      setEditingCommentId(null);
    } catch (err) {
      setActionError(err.response?.data?.message || "Yorum güncellenemedi.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const comments = await deleteComment(id, commentId);
      setArticle((prev) => ({ ...prev, comments }));
    } catch (err) {
      setActionError(err.response?.data?.message || "Yorum silinemedi.");
    }
  };

  // İçerik artık kendi içinde scroll etmiyor, sayfanın kaydırma alanı olan
  // Layout.jsx'teki <main> takip ediliyor — makale ne kadar uzun olursa olsun
  // container aşağı doğru genişliyor, ilerleme sayfa scroll'undan hesaplanıyor.
  useEffect(() => {
    if (!article) return;
    const mainEl = document.querySelector("main");
    if (!mainEl) return;

    const handleScroll = () => {
      const scrollable = mainEl.scrollHeight - mainEl.clientHeight;
      const progress = scrollable <= 0 ? 100 : Math.min(100, Math.round((mainEl.scrollTop / scrollable) * 100));
      setReadProgress(progress);
    };

    handleScroll();
    mainEl.addEventListener("scroll", handleScroll);
    return () => mainEl.removeEventListener("scroll", handleScroll);
  }, [article]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteArticle(id);
      navigate("/userpage", { replace: true });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500">Yükleniyor...</p>;
  }

  if (!article) {
    return <p className="text-sm text-accent-coral">Makale bulunamadı.</p>;
  }

  const isOwner = user && article.author?._id === user._id;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Mobilde nokta sütunu için yatay boşluk yok — BottomBar'ın hemen üstünde
          yatay bir ilerleme çubuğu gösteriliyor, büyük ekranda gizli. */}
      <div className="fixed inset-x-0 bottom-16 z-20 h-1.5 bg-gray-200 lg:hidden">
        <div
          className="h-full bg-accent-gold transition-[width] duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      <div className="fixed left-8 top-20 z-20 hidden w-24 flex-col items-center gap-2 lg:flex">
        {Array.from({ length: 18 }).map((_, i) => {
          const size = 22 - i * 1;
          return (
            <span
              key={i}
              style={{ width: size, height: size }}
              className={`flex-none rounded-full transition-colors duration-200 ${
                i < Math.round((readProgress / 100) * 18) ? "bg-accent-gold" : "bg-gray-200"
              }`}
            />
          );
        })}
        {readProgress >= 100 && <SproutCelebration />}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 bg-gray-100 px-4 py-3">
          <h1 className="truncate text-lg font-semibold text-brand-900">{article.title}</h1>
          <Link
            to={`/users/${article.author?._id}`}
            className="flex flex-none items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-xs font-medium text-brand-700 hover:underline"
          >
            <span className="flex h-6 w-6 flex-none items-center justify-center overflow-hidden rounded-full bg-teal-500 text-[10px] font-bold text-white">
              {article.author?.avatar ? (
                <img src={article.author.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                article.author?.username?.[0]?.toUpperCase()
              )}
            </span>
            {article.author?.username}
          </Link>
        </div>

        <p className="border-b border-gray-100 px-4 py-2 text-xs text-gray-400">
          {formatFullDate(article.createdAt)}
        </p>

        {article.image && (
          <img src={article.image} alt={article.title} className="max-h-96 w-full object-cover" />
        )}

        <div className="prose prose-sm max-w-none p-4 prose-headings:text-brand-900 prose-a:text-brand-700 prose-strong:text-brand-900 prose-code:text-teal-900">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
        </div>

        {actionError && (
          <p className="px-4 pt-2 text-center text-xs text-accent-coral">{actionError}</p>
        )}

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

          <div className="flex flex-none items-center gap-2">
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

            {isOwner && (
              <button
                onClick={() => setIsEditingArticle(true)}
                aria-label="Makaleyi düzenle"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-brand-700 hover:bg-brand-600 hover:text-white"
              >
                <Pencil size={16} />
              </button>
            )}

            {isOwner && (
              isConfirmingDelete ? (
                <div className="flex items-center gap-1 rounded-full bg-gray-100 py-1 pl-3 pr-1">
                  <span className="text-xs text-brand-900">Silinsin mi?</span>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="rounded-full bg-accent-coral px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {isDeleting ? "..." : "Evet, sil"}
                  </button>
                  <button
                    onClick={() => setIsConfirmingDelete(false)}
                    className="rounded-full bg-gray-200 px-2 py-1 text-xs text-brand-900"
                  >
                    Vazgeç
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingDelete(true)}
                  aria-label="Makaleyi sil"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-brand-700 hover:bg-accent-coral hover:text-white"
                >
                  <Trash2 size={16} />
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleAddComment} className="mt-4 flex items-center gap-2 rounded-2xl bg-gray-700 p-3">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Yorumunu buraya yaz..."
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
          [...article.comments].reverse().map((comment) => {
            const isCommentOwner = comment.user?._id === user?._id;
            const canDelete = isCommentOwner || isOwner;
            const isEditingThis = editingCommentId === comment._id;

            return (
              <div key={comment._id} className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent-gold text-xs font-bold text-brand-900">
                  {comment.user?.username?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2 text-sm text-brand-900">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-brand-700">
                      {comment.user?.username || "kullanıcı"}
                    </p>
                    {!isEditingThis && (isCommentOwner || canDelete) && (
                      <div className="flex flex-none items-center gap-1">
                        {isCommentOwner && (
                          <button
                            onClick={() => handleStartEditComment(comment)}
                            aria-label="Yorumu düzenle"
                            className="text-gray-400 hover:text-brand-700"
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            aria-label="Yorumu sil"
                            className="text-gray-400 hover:text-accent-coral"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {isEditingThis ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        className="flex-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-brand-900 outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveComment(comment._id)}
                        className="rounded-full bg-brand-600 px-2 py-1 text-xs font-semibold text-white"
                      >
                        Kaydet
                      </button>
                      <button
                        onClick={() => setEditingCommentId(null)}
                        className="rounded-full bg-gray-200 px-2 py-1 text-xs text-brand-900"
                      >
                        Vazgeç
                      </button>
                    </div>
                  ) : (
                    comment.text
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {isEditingArticle && (
        <ArticleFormModal
          article={article}
          onClose={() => setIsEditingArticle(false)}
          onSaved={(updated) => setArticle((prev) => ({ ...prev, ...updated }))}
        />
      )}
    </div>
  );
}
