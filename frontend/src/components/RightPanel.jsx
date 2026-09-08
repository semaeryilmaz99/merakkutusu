import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLibrary } from "../context/LibraryContext";
import ChatPanel from "./ChatPanel";

function LibraryPanel() {
  // Kütüphane verisi artık LibraryContext'ten geliyor (Library.jsx sayfasıyla
  // paylaşılan tek kaynak) — burada sadece "yeni eklenen makaleyi vurgula ve
  // en alta kaydır" animasyonu için event'in detail bilgisi kullanılıyor,
  // veri çekme işi merkezi context'te.
  const { library, isLoading } = useLibrary();
  const [highlightedId, setHighlightedId] = useState(null);
  const scrollRef = useRef(null);
  const shouldScrollRef = useRef(false);

  useEffect(() => {
    const handleLibraryChange = (e) => {
      if (e.detail.isInLibrary) {
        shouldScrollRef.current = true;
        setHighlightedId(e.detail.articleId);
        setTimeout(() => {
          setHighlightedId((prev) => (prev === e.detail.articleId ? null : prev));
        }, 2500);
      }
    };
    window.addEventListener("library:changed", handleLibraryChange);
    return () => window.removeEventListener("library:changed", handleLibraryChange);
  }, []);

  // Yeni eklenen makale liste sonuna ekleniyor (backend push ile ekliyor) — eklendiğinde
  // scroll'u en alta kaydırıp yeni makaleyi görünür yapıyoruz.
  useEffect(() => {
    if (shouldScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      shouldScrollRef.current = false;
    }
  }, [library]);

  return (
    <>
      <div className="mb-4 rounded-full bg-white px-4 py-2 text-center text-sm font-medium text-brand-900">
        kütüphanen
      </div>

      {isLoading ? (
        <p className="text-center text-sm text-white/70">Yükleniyor...</p>
      ) : library.length === 0 ? (
        <p className="text-center text-sm text-white/70">Kütüphaneniz boş — beğendiğiniz makaleleri ekleyin.</p>
      ) : (
        <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          {library.map((article) => (
            <Link
              key={article._id}
              to={`/articles/${article._id}`}
              className={`flex items-center gap-3 rounded-xl p-2 transition-all duration-1000 ${
                article._id === highlightedId
                  ? "bg-white/50 shadow-[0_0_20px_6px_rgba(255,255,255,0.55)]"
                  : "bg-white/10 shadow-none hover:bg-white/20"
              }`}
            >
              <div className="h-12 w-12 flex-none overflow-hidden rounded-lg bg-teal-500">
                {article.image && (
                  <img src={article.image} alt="" loading="lazy" className="h-full w-full object-cover" />
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

function LibraryWithChat() {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setShowChat(false)}
          className={`flex-1 rounded-full px-3 py-2 text-xs font-medium ${
            !showChat ? "bg-white text-brand-900" : "bg-white/10 text-white/80"
          }`}
        >
          Kütüphane
        </button>
        <button
          onClick={() => setShowChat(true)}
          className={`flex-1 rounded-full px-3 py-2 text-xs font-medium ${
            showChat ? "bg-white text-brand-900" : "bg-white/10 text-white/80"
          }`}
        >
          Sohbet
        </button>
      </div>

      {showChat ? <ChatPanel roomRequest={{ type: "dashboard" }} /> : <LibraryPanel />}
    </>
  );
}

export default function RightPanel({ variant = "library", roomRequest }) {
  return (
    <aside className="hidden w-80 flex-col overflow-hidden bg-teal-900 p-4 text-white lg:flex">
      {variant === "chat" && <ChatPanel roomRequest={roomRequest} />}
      {variant === "libraryWithChat" && <LibraryWithChat />}
      {variant === "library" && <LibraryPanel />}
    </aside>
  );
}
