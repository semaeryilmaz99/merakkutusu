import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Compass, Flame } from "lucide-react";
import { getExploreFeed, getCategories, getTrendingArticles, getTrendingTags } from "../services/articleService";
import ArticleCard from "../components/ArticleCard";
import ArticleGrid from "../components/UI/ArticleGrid";
import ArticleCardSkeleton from "../components/UI/ArticleCardSkeleton";
import EmptyState from "../components/UI/EmptyState";

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
    return (
      <ArticleGrid>
        {Array.from({ length: 6 }).map((_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </ArticleGrid>
    );
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

          <ArticleGrid>
            {trending.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </ArticleGrid>
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
              <ArticleGrid>
                {articles.map((article) => (
                  <ArticleCard key={article._id} article={article} />
                ))}
              </ArticleGrid>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-brand-900">Senin İçin Keşfet</h2>
        {feed.length === 0 ? (
          <EmptyState icon={Compass} title="Şu an gösterilecek makale yok." />
        ) : (
          <ArticleGrid>
            {feed.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </ArticleGrid>
        )}
      </section>
    </div>
  );
}
