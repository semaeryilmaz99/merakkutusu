import { useLibrary } from "../context/LibraryContext";
import ArticleCard from "../components/ArticleCard";

export default function Library() {
  const { library, isLoading } = useLibrary();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Yükleniyor...</p>;
  }

  if (library.length === 0) {
    return <p className="text-sm text-gray-500">Kütüphaneniz boş — beğendiğiniz makaleleri ekleyin.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {library.map((article) => (
        <ArticleCard key={article._id} article={article} />
      ))}
    </div>
  );
}
