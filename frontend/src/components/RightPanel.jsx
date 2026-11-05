import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLibrary } from "../context/LibraryContext";
import ChatPanel from "./ChatPanel";

const COLLAPSE_STORAGE_KEY = "rightPanelCollapsed";

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
  // Panel her sayfada sabit 320px kaplıyordu (ChatGPT'nin de haklı olarak
  // eleştirdiği nokta) — artık daraltılabilir. Tercih localStorage'da
  // saklanıyor (AuthContext'teki token deseniyle aynı basit yaklaşım), böylece
  // sayfa yenilense/başka sayfaya geçilse de kullanıcının seçimi korunuyor.
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true"
  );

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      return next;
    });
  };

  // Sidebar.jsx'teki gibi TEK bir eleman, genişliği animasyonla değişiyor —
  // eskiden daraltma/genişletme iki ayrı JSX ağacı arasında anlık bir
  // sıçramaydı (koşullu return), artık Sidebar'ın transition-transform'una
  // paralel olarak transition-[width] ile 300ms'de yumuşakça açılıp kapanıyor.
  // İçerik de tek seferde kaybolmasın diye iki katman (daraltılmış şerit +
  // açık içerik) her zaman DOM'da kalıp opacity ile çapraz geçiş yapıyor;
  // dış kapsayıcı overflow-hidden olduğu için daralmışken açık katman
  // kırpılıyor, görünürde sadece şerit kalıyor.
  return (
    <aside
      className={`relative hidden flex-none overflow-hidden bg-teal-900 text-white transition-[width] duration-300 ease-in-out lg:flex ${
        isCollapsed ? "w-12" : "w-80"
      }`}
    >
      <div
        className={`absolute inset-y-0 left-0 flex w-12 flex-col items-center py-4 transition-opacity duration-200 ${
          isCollapsed ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <button
          onClick={toggleCollapsed}
          aria-label="Paneli genişlet"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <div
        className={`absolute inset-y-0 left-0 flex w-80 flex-col overflow-hidden p-4 transition-opacity duration-200 ${
          isCollapsed ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <button
          onClick={toggleCollapsed}
          aria-label="Paneli daralt"
          className="mb-3 flex h-8 w-8 flex-none items-center justify-center self-end rounded-full text-white/70 hover:bg-white/10 hover:text-white"
        >
          <ChevronRight size={16} />
        </button>

        {variant === "chat" && <ChatPanel roomRequest={roomRequest} />}
        {variant === "libraryWithChat" && <LibraryWithChat />}
        {variant === "library" && <LibraryPanel />}
      </div>
    </aside>
  );
}
