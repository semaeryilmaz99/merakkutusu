import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Hash } from "lucide-react";
import { useTranslation } from "react-i18next";
import { filterByTag } from "../services/articleService";
import ArticleCard from "../components/ArticleCard";
import ArticleGrid from "../components/UI/ArticleGrid";
import ArticleCardSkeleton from "../components/UI/ArticleCardSkeleton";
import EmptyState from "../components/UI/EmptyState";

export default function CategoryDetail() {
  const { t } = useTranslation("category");
  const { tagName } = useParams();
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    filterByTag(tagName)
      .then(setArticles)
      .finally(() => setIsLoading(false));
  }, [tagName]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link
          to="/explore"
          aria-label={t("backAria")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-700 hover:bg-gray-100"
        >
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-lg font-semibold text-brand-900">#{tagName}</h1>
      </div>

      {isLoading ? (
        <ArticleGrid>
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </ArticleGrid>
      ) : articles.length === 0 ? (
        <EmptyState icon={Hash} title={t("empty")} />
      ) : (
        <ArticleGrid>
          {articles.map((article) => (
            <ArticleCard key={article._id} article={article} />
          ))}
        </ArticleGrid>
      )}
    </div>
  );
}
