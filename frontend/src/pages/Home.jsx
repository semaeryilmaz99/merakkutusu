import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { getPersonalizedFeed, searchArticles } from "../services/articleService";
import { searchUsers } from "../services/userService";
import api from "../services/api";
import ArticleCard from "../components/ArticleCard";

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [matchedUsers, setMatchedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const isFiltering = query.trim() !== "" || selectedTag !== "";

  useEffect(() => {
    getPersonalizedFeed()
      .then(setArticles)
      .finally(() => setIsLoading(false));

    api.get("/tags").then(({ data }) => setTags(data));
  }, []);

  const runSearch = async (q, tag) => {
    setIsLoading(true);
    try {
      const [results, users] = await Promise.all([
        searchArticles({ q: q || undefined, tags: tag || undefined }),
        q?.trim() ? searchUsers(q.trim()) : Promise.resolve([]),
      ]);
      setArticles(results);
      setMatchedUsers(users);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch(query, selectedTag);
  };

  const handleSelectTag = (tagName) => {
    const next = selectedTag === tagName ? "" : tagName;
    setSelectedTag(next);
    setIsFilterOpen(false);
    runSearch(query, next);
  };

  const clearFilters = () => {
    setQuery("");
    setSelectedTag("");
    setMatchedUsers([]);
    setIsLoading(true);
    getPersonalizedFeed()
      .then(setArticles)
      .finally(() => setIsLoading(false));
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-6 flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-full border-2 border-brand-700 bg-white px-4 py-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Makale, kullanıcı veya konu arayın..."
            className="flex-1 text-sm text-brand-900 outline-none"
          />
          <button type="submit" aria-label="Ara" className="text-brand-700">
            <Search size={18} />
          </button>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsFilterOpen((v) => !v)}
            aria-label="Tag filtrele"
            className={`flex h-11 w-11 items-center justify-center rounded-full border-2 ${
              selectedTag ? "border-accent-gold bg-accent-gold text-brand-900" : "border-brand-700 bg-white text-brand-700"
            }`}
          >
            <SlidersHorizontal size={18} />
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 z-10 mt-2 max-h-64 w-56 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
              {tags.map((tag) => (
                <button
                  key={tag._id}
                  type="button"
                  onClick={() => handleSelectTag(tag.name)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                    selectedTag === tag.name ? "bg-accent-gold text-brand-900" : "text-brand-900 hover:bg-gray-100"
                  }`}
                >
                  #{tag.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {isFiltering && (
          <button
            type="button"
            onClick={clearFilters}
            aria-label="Filtreyi temizle"
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gray-200 text-brand-900 hover:bg-gray-300"
          >
            <X size={18} />
          </button>
        )}
      </form>

      {!isLoading && matchedUsers.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-brand-900">Kullanıcılar</h2>
          <div className="flex flex-wrap gap-2">
            {matchedUsers.map((matchedUser) => (
              <Link
                key={matchedUser._id}
                to={`/users/${matchedUser._id}`}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-brand-800 shadow-sm hover:bg-gray-100"
              >
                @{matchedUser.username}
              </Link>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Yükleniyor...</p>
      ) : articles.length === 0 ? (
        <p className="text-sm text-gray-500">
          {isFiltering
            ? matchedUsers.length > 0
              ? "Eşleşen makale yok, ama yukarıda kullanıcı sonuçları var."
              : "Sonuç bulunamadı."
            : "Henüz feed'inizde makale yok — ilgi alanı seçin veya birilerini takip edin."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article._id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
