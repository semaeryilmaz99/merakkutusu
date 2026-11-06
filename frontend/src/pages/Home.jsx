import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, SearchX, Sparkles, SlidersHorizontal, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getPersonalizedFeed, searchArticles } from "../services/articleService";
import { searchUsers } from "../services/userService";
import api from "../services/api";
import ArticleCard from "../components/ArticleCard";
import ArticleGrid from "../components/UI/ArticleGrid";
import ArticleCardSkeleton from "../components/UI/ArticleCardSkeleton";
import EmptyState from "../components/UI/EmptyState";
import ScrollToTopButton from "../components/ScrollToTopButton";

const PAGE_SIZE = 12;

export default function Home() {
  const { t } = useTranslation("home");
  const [articles, setArticles] = useState([]);
  const [matchedUsers, setMatchedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const isFiltering = query.trim() !== "" || selectedTag !== "";
  const debounceRef = useRef(null);
  const didMountRef = useRef(false);

  // Aynı arama tekrar yapılırsa (ör. bir tag'i açıp kapatıp tekrar seçmek,
  // ya da aynı kelimeyi tekrar yazmak) ağa yeniden gitmemek için — SADECE
  // filtreli aramalarda (isFiltering) devrede. Boş sorgulu kişisel feed her
  // zaman taze çekiliyor, çünkü o daha dinamik ve yeni makale kaçırma riski
  // var. Sayfa yenilenince sıfırlanması bilinçli, kalıcı olması gerekmiyor.
  const searchCacheRef = useRef(new Map());
  const MAX_SEARCH_CACHE_ENTRIES = 50;
  const searchCacheKey = (q, tag, targetPage) => `${q || ""}::${tag || ""}::${targetPage}`;
  const readSearchCache = (q, tag, targetPage) => searchCacheRef.current.get(searchCacheKey(q, tag, targetPage));
  const writeSearchCache = (q, tag, targetPage, value) => {
    const cache = searchCacheRef.current;
    const key = searchCacheKey(q, tag, targetPage);
    if (!cache.has(key) && cache.size >= MAX_SEARCH_CACHE_ENTRIES) {
      cache.delete(cache.keys().next().value); // en eski kaydı sil (FIFO)
    }
    cache.set(key, value);
  };
  // Aynı anda birden fazla arama isteği havada olabilir (kullanıcı yazarken
  // ara ara duraklarsa her duraklama bir istek başlatır) ve bunlar network'te
  // farklı sürede dönebilir — geç gelen eski bir cevap, daha yeni ve doğru
  // sonucun üzerine yazmasın diye her isteğe bir sıra numarası veriyoruz,
  // sadece "hâlâ en son istek benim" olan cevap state'e uygulanıyor.
  const requestIdRef = useRef(0);

  // Şu an aktif olan sorguyu (feed ya da arama) tekrar üretmek için —
  // hem ilk yüklemede hem "daha fazla yükle"de aynı mantığı kullanmak için tek yerde tutuluyor.
  const fetchPage = (targetPage, q, tag) =>
    q?.trim() || tag
      ? searchArticles({ q: q || undefined, tags: tag || undefined, page: targetPage, limit: PAGE_SIZE })
      : getPersonalizedFeed(targetPage, PAGE_SIZE);

  const loadArticles = async (q, tag) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    try {
      const isSearch = Boolean(q?.trim() || tag);
      if (isSearch) {
        const cached = readSearchCache(q, tag, 1);
        if (cached) {
          setArticles(cached.results);
          setMatchedUsers(cached.users);
          setHasMore(cached.results.length === PAGE_SIZE);
          setPage(1);
          return;
        }
      }

      const [results, users] = await Promise.all([
        fetchPage(1, q, tag),
        q?.trim() ? searchUsers(q.trim()) : Promise.resolve([]),
      ]);
      if (requestId !== requestIdRef.current) return; // daha yeni bir istek başladı, bu cevap eskidi
      setArticles(results);
      setMatchedUsers(users);
      setHasMore(results.length === PAGE_SIZE);
      setPage(1);
      if (isSearch) writeSearchCache(q, tag, 1, { results, users });
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArticles("", "");
    api.get("/tags").then(({ data }) => setTags(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kullanıcı yazarken her tuşta backend'e istek atmamak için (regex arama
  // her seferinde tüm koleksiyonu tarıyor) — yazma durunca 350ms bekleyip
  // sonra arıyoruz. İlk mount'ta zaten yukarıdaki efekt feed'i çekiyor,
  // bu yüzden ilk render'ı atlıyoruz.
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadArticles(query, selectedTag);
    }, 350);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    loadArticles(query, selectedTag);
  };

  const handleSelectTag = (tagName) => {
    const next = selectedTag === tagName ? "" : tagName;
    setSelectedTag(next);
    setIsFilterOpen(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    loadArticles(query, next);
  };

  const clearFilters = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery("");
    setSelectedTag("");
    loadArticles("", "");
  };

  const loadMore = async () => {
    const requestId = requestIdRef.current;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const isSearch = Boolean(query?.trim() || selectedTag);

      if (isSearch) {
        const cached = readSearchCache(query, selectedTag, nextPage);
        if (cached) {
          setArticles((prev) => [...prev, ...cached.results]);
          setHasMore(cached.results.length === PAGE_SIZE);
          setPage(nextPage);
          return;
        }
      }

      const results = await fetchPage(nextPage, query, selectedTag);
      if (requestId !== requestIdRef.current) return; // bu arada yeni bir arama/filtre başladı
      setArticles((prev) => [...prev, ...results]);
      setHasMore(results.length === PAGE_SIZE);
      setPage(nextPage);
      if (isSearch) writeSearchCache(query, selectedTag, nextPage, { results, users: [] });
    } finally {
      if (requestId === requestIdRef.current) setIsLoadingMore(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-6 flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 shadow-sm">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.placeholder")}
            maxLength={200}
            className="flex-1 text-sm text-brand-900 outline-none"
          />
          <button type="submit" aria-label={t("search.searchAria")} className="text-brand-700">
            <Search size={18} />
          </button>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsFilterOpen((v) => !v)}
            aria-label={t("search.filterAria")}
            className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-sm ${
              selectedTag ? "border-accent-gold bg-accent-gold text-brand-900" : "border-gray-300 bg-white text-brand-700"
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
            aria-label={t("search.clearAria")}
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gray-200 text-brand-900 hover:bg-gray-300"
          >
            <X size={18} />
          </button>
        )}
      </form>

      {!isLoading && matchedUsers.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-brand-900">{t("users.heading")}</h2>
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
        <ArticleGrid>
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </ArticleGrid>
      ) : articles.length === 0 ? (
        <EmptyState
          icon={isFiltering ? SearchX : Sparkles}
          title={
            isFiltering
              ? matchedUsers.length > 0
                ? t("empty.noMatchButUsers")
                : t("empty.noResults")
              : t("empty.noFeed")
          }
          description={isFiltering ? undefined : t("empty.noFeedDescription")}
          action={isFiltering ? undefined : { label: t("empty.exploreAction"), to: "/explore" }}
        />
      ) : (
        <>
          <ArticleGrid>
            {articles.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </ArticleGrid>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="rounded-full bg-brand-700 px-6 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50"
              >
                {isLoadingMore ? t("loadMore.loading") : t("loadMore.button")}
              </button>
            </div>
          )}
        </>
      )}

      <ScrollToTopButton />
    </div>
  );
}
