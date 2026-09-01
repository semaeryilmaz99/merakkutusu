import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { filterByTag } from "../services/articleService";
import ArticleCard from "../components/ArticleCard";

export default function CategoryDetail() {
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
          aria-label="Keşfet'e dön"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-700 hover:bg-gray-100"
        >
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-lg font-semibold text-brand-900">#{tagName}</h1>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Yükleniyor...</p>
      ) : articles.length === 0 ? (
        <p className="text-sm text-gray-500">Bu kategoride henüz makale yok.</p>
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
