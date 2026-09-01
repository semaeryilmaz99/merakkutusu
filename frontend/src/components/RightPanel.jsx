import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyLibrary } from "../services/articleService";

function LibraryPanel() {
  const [library, setLibrary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMyLibrary()
      .then(setLibrary)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <>
      <div className="mb-4 rounded-full bg-white px-4 py-2 text-center text-sm font-medium text-brand-900">
        your library
      </div>

      {isLoading ? (
        <p className="text-center text-sm text-white/70">Yükleniyor...</p>
      ) : library.length === 0 ? (
        <p className="text-center text-sm text-white/70">Kütüphaneniz boş — beğendiğiniz makaleleri ekleyin.</p>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto">
          {library.map((article) => (
            <Link
              key={article._id}
              to={`/articles/${article._id}`}
              className="flex items-center gap-3 rounded-xl bg-white/10 p-2 hover:bg-white/20"
            >
              <div className="h-12 w-12 flex-none overflow-hidden rounded-lg bg-teal-500">
                {article.image && (
                  <img src={article.image} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {article.author?.username || "author"}
                </p>
                <p className="truncate text-xs text-white/70">{article.title}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export default function RightPanel({ variant = "library" }) {
  return (
    <aside className="hidden w-80 flex-col bg-brand-700 p-4 text-white lg:flex">
      {variant === "chat" ? (
        <>
          <div className="mb-4 flex items-center justify-between rounded-full bg-white px-4 py-2 text-sm font-medium text-brand-900">
            <span>author username</span>
            <span className="h-6 w-6 rounded-full bg-teal-500" />
          </div>
          <div className="flex flex-1 items-center justify-center text-sm text-white/70">
            Sohbet yakında burada olacak
          </div>
        </>
      ) : (
        <LibraryPanel />
      )}
    </aside>
  );
}
