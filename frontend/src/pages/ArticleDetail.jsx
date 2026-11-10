import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Heart, Library, Pencil, Send, Share2, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
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
import { followUser } from "../services/userService";
import { formatFullDate } from "../utils/formatDate";
import ArticleFormModal from "../components/ArticleFormModal";
import UserListModal from "../components/UI/UserListModal";

export default function ArticleDetail() {
  const { t } = useTranslation("article");
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingArticle, setIsEditingArticle] = useState(false);
  const [actionError, setActionError] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);

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
        setIsFavorite(articleData.favorites?.some((f) => (f._id || f) === user?._id));
        setIsInLibrary(library.some((a) => a._id === articleData._id));
        setIsFollowing(Boolean(articleData.author?.isFollowing));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, user?._id]);

  // Makale başka bir yerden (ör. RightPanel'in kütüphane listesindeki eksi
  // butonu) kütüphaneden çıkarılırsa/eklenirse, bu sayfadaki buton da senkron
  // kalsın — bkz. ArticleCard.jsx'teki aynı mantık.
  useEffect(() => {
    const handleLibraryChanged = (e) => {
      if (e.detail.articleId === id) setIsInLibrary(e.detail.isInLibrary);
    };
    window.addEventListener("library:changed", handleLibraryChanged);
    return () => window.removeEventListener("library:changed", handleLibraryChanged);
  }, [id]);

  useEffect(() => {
    if (!actionError) return;
    const timeout = setTimeout(() => setActionError(""), 3000);
    return () => clearTimeout(timeout);
  }, [actionError]);

  const handleToggleFavorite = async () => {
    const previouslyFavorite = isFavorite;
    const previousFavorites = article.favorites || [];
    setIsFavorite(!previouslyFavorite);
    // Sayı ve "kimler beğendi" listesi sunucu cevabını beklemeden, iyimser
    // güncelleniyor — kendimizi ekleyip/çıkarıyoruz, gerçek (populate edilmiş)
    // liste cevap gelince res.data.favorites ile tam olarak senkronize ediliyor.
    setArticle((prev) => ({
      ...prev,
      favorites: previouslyFavorite
        ? previousFavorites.filter((f) => (f._id || f) !== user?._id)
        : [...previousFavorites, { _id: user?._id, username: user?.username, avatar: user?.avatar }],
    }));
    try {
      const { favorites } = await toggleFavorite(id);
      setArticle((prev) => ({ ...prev, favorites }));
    } catch {
      setIsFavorite(previouslyFavorite);
      setArticle((prev) => ({ ...prev, favorites: previousFavorites }));
      setActionError(t("errors.favoriteUpdateFailed"));
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
      setActionError(t("errors.libraryUpdateFailed"));
    }
  };

  // PublicProfile.jsx'teki takip butonuyla aynı optimistic-toggle deseni —
  // backend zaten follow/unfollow'u tek bir toggle endpoint'i olarak sunuyor.
  const handleToggleFollow = async () => {
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    try {
      await followUser(article.author._id);
    } catch {
      setIsFollowing(wasFollowing);
      setActionError(t("errors.followUpdateFailed"));
    }
  };

  // Web Share API destekleniyorsa (çoğu mobil tarayıcı) native paylaşım
  // sayfasını açar; desteklemeyen tarayıcılarda bağlantıyı panoya kopyalar.
  const handleShare = async () => {
    const shareData = { title: article.title, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err?.name !== "AbortError") setActionError(t("errors.shareFailed"));
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      setActionError(t("errors.linkCopyFailed"));
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
      setActionError(err.response?.data?.message || t("errors.commentUpdateFailed"));
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const comments = await deleteComment(id, commentId);
      setArticle((prev) => ({ ...prev, comments }));
    } catch (err) {
      setActionError(err.response?.data?.message || t("errors.commentDeleteFailed"));
    }
  };

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
    return <p className="text-sm text-gray-500">{t("loading")}</p>;
  }

  if (!article) {
    return <p className="text-sm text-accent-coral">{t("notFound")}</p>;
  }

  const isOwner = user && article.author?._id === user._id;
  // Liste/feed endpoint'leri readingMinutes'ı toArticleSummary.js'te hesaplıyor
  // ama getArticleById ham makaleyi dönüyor — burada zaten tam content elimizde
  // olduğu için aynı formülü (200 kelime/dk) client-side uyguluyoruz.
  const wordCount = article.content.trim() ? article.content.trim().split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="p-4 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {(article.tags || []).map((tag) => (
              <span
                key={tag._id || tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-brand-800"
              >
                #{tag.name || tag}
              </span>
            ))}
            <span className="text-xs text-gray-400">{t("readTime", { time: readTime })}</span>
          </div>

          <h1 className="text-2xl font-bold leading-tight text-brand-900 sm:text-3xl">{article.title}</h1>

          {article.subtitle && <p className="mt-2 text-base italic text-gray-600">{article.subtitle}</p>}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <Link to={`/users/${article.author?._id}`} className="flex items-center gap-3">
              <span className="flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-full bg-teal-500 text-sm font-bold text-white">
                {article.author?.avatar ? (
                  <img src={article.author.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  article.author?.username?.[0]?.toUpperCase()
                )}
              </span>
              <span>
                <span className="block text-sm font-semibold text-brand-900 hover:underline">
                  {article.author?.username}
                </span>
                <span className="block text-xs text-gray-400">{formatFullDate(article.createdAt)}</span>
              </span>
            </Link>

            {!isOwner && user && (
              <button
                onClick={handleToggleFollow}
                className={`flex-none rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  isFollowing
                    ? "border border-gray-300 bg-white text-brand-900 hover:bg-gray-50"
                    : "bg-accent-gold text-brand-900 hover:brightness-95"
                }`}
              >
                {isFollowing ? t("follow.unfollow") : t("follow.follow")}
              </button>
            )}
          </div>
        </div>

        {article.image && (
          <img src={article.image} alt={article.title} className="max-h-96 w-full object-cover" />
        )}

        <div className="prose prose-sm max-w-none p-4 sm:p-6 prose-headings:text-brand-900 prose-a:text-brand-700 prose-strong:text-brand-900 prose-code:text-teal-900">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children, ...props }) => (
                <a href={href} target="_blank" rel="noreferrer" {...props}>
                  {children}
                </a>
              )
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>

        {actionError && <p className="px-4 pt-2 text-center text-xs text-accent-coral">{actionError}</p>}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToggleFavorite}
                aria-label={t("actions.favoriteAria")}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  isFavorite
                    ? "bg-accent-coral text-white"
                    : "border border-gray-300 bg-white text-brand-700 hover:bg-gray-50"
                }`}
              >
                <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
              </button>
              {(article.favorites?.length || 0) > 0 && (
                <button
                  onClick={() => setIsFavoritesModalOpen(true)}
                  aria-label={t("actions.favoritesCountAria", { count: article.favorites.length })}
                  className="text-sm font-medium text-brand-700 hover:underline"
                >
                  {article.favorites.length}
                </button>
              )}
            </div>
            <button
              onClick={handleToggleLibrary}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isInLibrary
                  ? "bg-brand-600 text-white"
                  : "border border-gray-300 bg-white text-brand-700 hover:bg-gray-50"
              }`}
            >
              <Library size={16} />
              {t("actions.save")}
            </button>

            {isOwner && (
              <button
                onClick={() => setIsEditingArticle(true)}
                aria-label={t("actions.editAria")}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-brand-700 hover:bg-brand-600 hover:text-white"
              >
                <Pencil size={16} />
              </button>
            )}

            {isOwner &&
              (isConfirmingDelete ? (
                <div className="flex items-center gap-1 rounded-full bg-gray-100 py-1 pl-3 pr-1">
                  <span className="text-xs text-brand-900">{t("actions.deleteConfirmQuestion")}</span>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="rounded-full bg-accent-coral px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {isDeleting ? "..." : t("actions.deleteConfirmYes")}
                  </button>
                  <button
                    onClick={() => setIsConfirmingDelete(false)}
                    className="rounded-full bg-gray-200 px-2 py-1 text-xs text-brand-900"
                  >
                    {t("actions.deleteCancel")}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingDelete(true)}
                  aria-label={t("actions.deleteAria")}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-brand-700 hover:bg-accent-coral hover:text-white"
                >
                  <Trash2 size={16} />
                </button>
              ))}
          </div>

          <div className="relative flex-none">
            <button
              onClick={handleShare}
              aria-label={t("actions.shareAria")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-brand-700 hover:bg-gray-50"
            >
              <Share2 size={16} />
            </button>
            {shareCopied && (
              <span className="absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-full bg-brand-900 px-2 py-1 text-[11px] text-white">
                {t("actions.linkCopied")}
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 p-4 sm:p-6">
          <h2 className="mb-4 text-base font-bold text-brand-900">
            {t("comments.heading", { count: (article.comments || []).length })}
          </h2>

          <form onSubmit={handleAddComment} className="flex items-center gap-2">
            <span className="flex h-8 w-8 flex-none items-center justify-center overflow-hidden rounded-full bg-teal-500 text-xs font-bold text-white">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                user?.username?.[0]?.toUpperCase()
              )}
            </span>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={t("comments.placeholder")}
              className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm text-brand-900 outline-none"
            />
            <button
              type="submit"
              disabled={isSubmittingComment}
              aria-label={t("comments.sendAria")}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <Send size={16} />
            </button>
          </form>

          <div className="mt-2 flex flex-col">
            {(article.comments || []).length === 0 ? (
              <p className="py-3 text-sm text-gray-400">{t("comments.empty")}</p>
            ) : (
              [...article.comments].reverse().map((comment) => {
                const isCommentOwner = comment.user?._id === user?._id;
                const canDelete = isCommentOwner || isOwner;
                const isEditingThis = editingCommentId === comment._id;

                return (
                  <div
                    key={comment._id}
                    className="flex items-start gap-3 border-t border-gray-100 py-3 first:border-t-0 first:pt-3"
                  >
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent-gold text-xs font-bold text-brand-900">
                      {comment.user?.username?.[0]?.toUpperCase() || "?"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-brand-700">
                          {comment.user?.username || t("comments.unknownUser")}
                        </p>
                        {!isEditingThis && canDelete && (
                          <div className="flex flex-none items-center gap-2">
                            {isCommentOwner && (
                              <button
                                onClick={() => handleStartEditComment(comment)}
                                aria-label={t("comments.editAria")}
                                className="text-gray-400 hover:text-brand-700"
                              >
                                <Pencil size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              aria-label={t("comments.deleteAria")}
                              className="text-gray-400 hover:text-accent-coral"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>

                      {isEditingThis ? (
                        <div className="mt-1 flex items-center gap-2">
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
                            {t("comments.saveEdit")}
                          </button>
                          <button
                            onClick={() => setEditingCommentId(null)}
                            className="rounded-full bg-gray-200 px-2 py-1 text-xs text-brand-900"
                          >
                            {t("comments.cancelEdit")}
                          </button>
                        </div>
                      ) : (
                        <p className="mt-0.5 text-sm text-gray-700">{comment.text}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {isEditingArticle && (
        <ArticleFormModal
          article={article}
          onClose={() => setIsEditingArticle(false)}
          onSaved={(updated) => setArticle((prev) => ({ ...prev, ...updated }))}
        />
      )}

      {isFavoritesModalOpen && (
        <UserListModal
          title={t("favoritesModal.title")}
          users={article.favorites || []}
          emptyMessage={t("favoritesModal.empty")}
          onClose={() => setIsFavoritesModalOpen(false)}
        />
      )}
    </div>
  );
}
