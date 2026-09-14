import { Library as LibraryIcon } from "lucide-react";
import { useLibrary } from "../context/LibraryContext";
import ArticleCard from "../components/ArticleCard";
import ArticleGrid from "../components/UI/ArticleGrid";
import ArticleCardSkeleton from "../components/UI/ArticleCardSkeleton";
import EmptyState from "../components/UI/EmptyState";

export default function Library() {
  const { library, isLoading } = useLibrary();

  if (isLoading) {
    return (
      <ArticleGrid>
        {Array.from({ length: 6 }).map((_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </ArticleGrid>
    );
  }

  if (library.length === 0) {
    return (
      <EmptyState
        icon={LibraryIcon}
        title="Kütüphaneniz boş."
        description="Beğendiğiniz makaleleri daha sonra okumak için kütüphanenize ekleyin."
        action={{ label: "Keşfetmeye başla", to: "/explore" }}
      />
    );
  }

  return (
    <ArticleGrid>
      {library.map((article) => (
        <ArticleCard key={article._id} article={article} />
      ))}
    </ArticleGrid>
  );
}
