import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronsRight, Heart, Library } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toggleFavorite, toggleLibrary } from "../services/articleService";

export default function ArticleCard({ article, onLibraryChange }) {
  const { user } = useAuth();
  const tags = (article.tags || []).slice(0, 2);

  const [isFavorite, setIsFavorite] = useState((article.favorites || []).includes(user?._id));
  const [favoritesCount, setFavoritesCount] = useState((article.favorites || []).length);
  const [isInLibrary, setIsInLibrary] = useState((user?.library || []).includes(article._id));

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    setIsFavorite((prev) => !prev);
    setFavoritesCount((prev) => prev + (isFavorite ? -1 : 1));
    await toggleFavorite(article._id);
  };

  const handleToggleLibrary = async (e) => {
    e.preventDefault();
    const next = !isInLibrary;
    setIsInLibrary(next);
    onLibraryChange?.(article._id, next);
    await toggleLibrary(article._id);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-teal-500 bg-white shadow-sm">
      <div className="bg-gray-100 px-3 py-2">
        <p className="truncate text-sm font-semibold text-brand-900">{article.title}</p>
      </div>

      <div className="aspect-video w-full bg-gradient-to-br from-brand-400 to-teal-500">
        {article.image && (
          <img src={article.image} alt={article.title} className="h-full w-full object-cover" />
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
            aria-label="Favorilere ekle/çıkar"
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
            aria-label="Kütüphaneye ekle/çıkar"
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              isInLibrary ? "bg-brand-600 text-white" : "bg-gray-100 text-brand-700"
            }`}
          >
            <Library size={14} />
          </button>

          <Link
            to={`/articles/${article._id}`}
            aria-label="Makaleyi aç"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
          >
            <ChevronsRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
