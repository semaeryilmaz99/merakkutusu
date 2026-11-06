import { Library as LibraryIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLibrary } from "../context/LibraryContext";
import ArticleCard from "../components/ArticleCard";
import ArticleGrid from "../components/UI/ArticleGrid";
import ArticleCardSkeleton from "../components/UI/ArticleCardSkeleton";
import EmptyState from "../components/UI/EmptyState";

export default function Library() {
  const { t } = useTranslation("library");
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
        title={t("empty.title")}
        description={t("empty.description")}
        action={{ label: t("empty.action"), to: "/explore" }}
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
