import { useEffect, useState } from "react";
import { getMyLibrary } from "../services/articleService";
import ArticleCard from "../components/ArticleCard";

export default function Library() {
  const [library, setLibrary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMyLibrary()
      .then(setLibrary)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <p className="text-sm text-gray-500">Yükleniyor...</p>;
  }

  if (library.length === 0) {
    return <p className="text-sm text-gray-500">Kütüphaneniz boş — beğendiğiniz makaleleri ekleyin.</p>;
  }

  const handleLibraryChange = (articleId, isInLibrary) => {
    if (!isInLibrary) {
      setLibrary((prev) => prev.filter((a) => a._id !== articleId));
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {library.map((article) => (
        <ArticleCard key={article._id} article={article} onLibraryChange={handleLibraryChange} />
      ))}
    </div>
  );
}
