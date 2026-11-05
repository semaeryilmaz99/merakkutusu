import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const SHOW_THRESHOLD = 400;

// Home.jsx ve Explore.jsx'te kullanılıyor. Sayfa window değil Layout.jsx'teki
// <main> elemanı üzerinden kayıyor (ArticleDetail.jsx'teki okuma ilerleme
// çubuğu da aynı elemanı dinliyor) — bu yüzden scroll event'i oraya bağlanıyor.
export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const mainEl = document.querySelector("main");
    if (!mainEl) return;

    const handleScroll = () => setIsVisible(mainEl.scrollTop > SHOW_THRESHOLD);
    handleScroll();
    mainEl.addEventListener("scroll", handleScroll);
    return () => mainEl.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    // sticky (fixed DEĞİL): sağ kenarı viewport'un değil, bu elemanın içinde
    // bulunduğu <main>'in (kart ızgarasının) genişliğine göre hizalanıyor —
    // masaüstünde sağdaki RightPanel (kütüphane/sohbet) açıkken buton onun
    // üzerine binmesin diye. Dış div tıklamaları engellemesin diye
    // pointer-events-none, sadece buton kendisi pointer-events-auto.
    <div className="pointer-events-none sticky bottom-20 z-30 flex justify-end lg:bottom-6">
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Yukarı çık"
        tabIndex={isVisible ? 0 : -1}
        className={`flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg transition-all duration-200 hover:bg-brand-800 ${
          isVisible ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <ArrowUp size={20} />
      </button>
    </div>
  );
}
