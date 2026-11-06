import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Library, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { toggleFavorite, toggleLibrary } from "../services/articleService";
import { formatRelativeDate } from "../utils/formatDate";

export default function ArticleCard({ article, onLibraryChange }) {
  const { t } = useTranslation("article");
  const { user } = useAuth();
  const navigate = useNavigate();
  const tags = (article.tags || []).slice(0, 2);
  // Backend artık tam içerik yerine kısa bir excerpt + hazır hesaplanmış
  // readingMinutes gönderiyor (bkz. backend/utils/toArticleSummary.js) —
  // liste görünümünde tüm makale gövdesini indirmeye gerek yok.
  const excerpt = (article.excerpt || "")
    .replace(/```[\s\S]*?```/g, " ") // kod blokları
    .replace(/[#>*_~`]/g, "") // markdown biçim karakterleri
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // [link metni](url) / ![alt](url)
    .replace(/\s+/g, " ")
    .trim();
  const readingMinutes = article.readingMinutes || 1;

  const [isFavorite, setIsFavorite] = useState((article.favorites || []).includes(user?._id));
  const [favoritesCount, setFavoritesCount] = useState((article.favorites || []).length);
  const [isInLibrary, setIsInLibrary] = useState((user?.library || []).includes(article._id));

  // useState initializer sadece ilk mount'ta çalışır — aynı key'li
  // (article._id) bir kart, ebeveyn tekrar veri çekince YENİ favorites/
  // library bilgisiyle tekrar render edilse bile React aynı component
  // instance'ını yeniden kullandığı için (remount olmadığı için) bu yeni
  // veri hiç yansımıyordu (kart, başka biri favorilemiş olsa bile eski
  // favori sayısını göstermeye devam ediyordu). Prop değiştiğinde local
  // state'i senkronlar.
  useEffect(() => {
    setIsFavorite((article.favorites || []).includes(user?._id));
    setFavoritesCount((article.favorites || []).length);
  }, [article._id, article.favorites, user?._id]);

  useEffect(() => {
    setIsInLibrary((user?.library || []).includes(article._id));
  }, [article._id, user?.library]);

  const openArticle = () => navigate(`/articles/${article._id}`);

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    const previouslyFavorite = isFavorite;
    setIsFavorite((prev) => !prev);
    setFavoritesCount((prev) => prev + (previouslyFavorite ? -1 : 1));
    try {
      await toggleFavorite(article._id);
    } catch {
      setIsFavorite(previouslyFavorite);
      setFavoritesCount((prev) => prev + (previouslyFavorite ? 1 : -1));
    }
  };

  const handleToggleLibrary = async (e) => {
    e.stopPropagation();
    const previouslyInLibrary = isInLibrary;
    const next = !previouslyInLibrary;
    setIsInLibrary(next);
    onLibraryChange?.(article._id, next);
    try {
      await toggleLibrary(article._id);
      window.dispatchEvent(
        new CustomEvent("library:changed", { detail: { articleId: article._id, isInLibrary: next } })
      );
    } catch {
      setIsInLibrary(previouslyInLibrary);
      onLibraryChange?.(article._id, previouslyInLibrary);
    }
  };

  return (
    <div
      onClick={openArticle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openArticle();
        }
      }}
      role="button"
      tabIndex={0}
      className="flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="bg-gray-100 px-3 py-2">
        <p className="truncate text-sm font-semibold text-brand-900">{article.title}</p>
        {article.subtitle && <p className="truncate text-xs text-gray-500">{article.subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
        <div className="flex h-6 w-6 flex-none items-center justify-center overflow-hidden rounded-full bg-teal-500 text-[10px] font-bold text-white">
          {article.author?.avatar ? (
            <img src={article.author.avatar} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            article.author?.username?.[0]?.toUpperCase()
          )}
        </div>
        <p className="min-w-0 flex-1 truncate text-xs font-medium text-brand-800">
          {article.author?.username}
        </p>
        <span className="flex-none text-[10px] text-gray-400">{formatRelativeDate(article.createdAt)}</span>
        <span
          className="flex flex-none items-center gap-1 rounded-full bg-accent-gold/20 px-2 py-0.5 text-[10px] font-mono font-medium text-brand-800"
          title={t("readTimeTooltip")}
        >
          <Clock size={10} />
          {t("readTimeShort", { time: readingMinutes })}
        </span>
      </div>

      <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-brand-400 to-teal-500">
        {article.image && (
          <img src={article.image} alt={article.title} loading="lazy" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="relative h-20 overflow-hidden">
        {article.image ? (
          <div
            className="absolute inset-0 scale-125 bg-cover bg-center blur-lg"
            style={{ backgroundImage: `url(${article.image})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-400 to-teal-500" />
        )}
        <div className="absolute inset-0 bg-brand-900/70" />
        {excerpt && (
          <p className="relative z-10 line-clamp-3 p-3 text-xs leading-snug text-white/90">{excerpt}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 p-3">
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag._id || tag}
              className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-brand-800"
            >
              #{tag.name || tag}
            </span>
          ))}
        </div>

        <div className="flex flex-none items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-label={t("actions.favoriteAria")}
            className={`flex h-8 items-center gap-1 rounded-full px-2 text-xs font-medium ${
              isFavorite ? "bg-accent-coral text-white" : "bg-gray-100 text-brand-700"
            }`}
          >
            <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
            {favoritesCount}
          </button>

          <button
            type="button"
            onClick={handleToggleLibrary}
            aria-label={t("actions.libraryAria")}
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              isInLibrary ? "bg-brand-600 text-white" : "bg-gray-100 text-brand-700"
            }`}
          >
            <Library size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
