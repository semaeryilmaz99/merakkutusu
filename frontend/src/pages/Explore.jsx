import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Flame } from "lucide-react";
import { getExploreFeed, getCategories, getTrendingArticles, getTrendingTags } from "../services/articleService";
import ArticleCard from "../components/ArticleCard";

export default function Explore() {
  const [categories, setCategories] = useState([]);
  const [feed, setFeed] = useState([]);
  const [trending, setTrending] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCategories(), getExploreFeed(), getTrendingArticles(), getTrendingTags()])
      .then(([categoriesData, feedData, trendingData, trendingTagsData]) => {
        setCategories(categoriesData);
        setFeed(feedData);
        setTrending(trendingData);
        setTrendingTags(trendingTagsData);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <p className="text-sm text-gray-500">Yükleniyor...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {trending.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-brand-900">
            <Flame size={18} className="text-accent-coral" /> Trend Makaleler
          </h2>

          {trendingTags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {trendingTags.map((tag) => (
                <Link
                  key={tag._id}
                  to={`/explore/${tag.name}`}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 shadow-sm hover:bg-gray-100"
                >
                  #{tag.name} <span className="text-gray-400">({tag.count})</span>
                </Link>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {trending.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-brand-900">Kategoriler</h2>
        <div className="flex flex-col gap-6">
          {categories.map(({ tag, articleCount, articles }) => (
            <div key={tag._id}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-brand-800">
                  #{tag.name} <span className="text-gray-400">({articleCount})</span>
                </h3>
                <Link
                  to={`/explore/${tag.name}`}
                  className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                >
                  Tümünü gör <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {articles.map((article) => (
                  <ArticleCard key={article._id} article={article} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-brand-900">Senin İçin Keşfet</h2>
        {feed.length === 0 ? (
          <p className="text-sm text-gray-500">Şu an gösterilecek makale yok.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {feed.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
