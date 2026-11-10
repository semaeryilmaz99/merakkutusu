import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass, Library, StickyNote, LogOut, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import useResizableWidth from "../hooks/useResizableWidth";

const COLLAPSE_STORAGE_KEY = "sidebarCollapsed";
const DEFAULT_WIDTH = 256; // w-64
const MIN_WIDTH = 200;
const MAX_WIDTH = 380;

export default function Sidebar({ isOpen, onClose }) {
  const { t } = useTranslation("common");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Masaüstünde (lg+) sidebar artık kalıcı bir rail — "açık/kapalı" değil,
  // "daraltılmış (sadece ikon) / genişletilmiş (ikon + etiket)" durumu var.
  // Mobilde bu state'in etkisi yok (overlay her zaman tam genişlik açılır),
  // sadece lg: öneki altındaki class'lar bu state'e göre değişiyor.
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      } catch {
        // localStorage erişilemezse (gizli sekme vb.) sessizce yoksay
      }
      return next;
    });
  };

  // Genişletilmişken sağ kenardan sürükleyerek genişlik ayarlanabiliyor —
  // daraltılmışken (sabit ikon genişliği) sürüklemenin bir anlamı yok.
  const { width: sidebarWidth, isResizing, handleMouseDown } = useResizableWidth({
    storageKey: "sidebarWidth",
    defaultWidth: DEFAULT_WIDTH,
    min: MIN_WIDTH,
    max: MAX_WIDTH,
    edge: "right"
  });

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate("/login", { replace: true });
  };

  const linkClass = `flex items-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-medium text-brand-900 hover:bg-accent-gold transition-colors ${
    isCollapsed ? "lg:w-11 lg:justify-center lg:gap-0 lg:px-0" : ""
  }`;
  const labelClass = isCollapsed ? "lg:hidden" : "";

  return (
    <>
      {/* Backdrop — sadece mobil overlay modunda gerekli, lg+'da kalıcı rail'in arkasında anlamsız */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel — mobilde kayan tam genişlik overlay, lg+'da sayfa akışının
          parçası (static) kalıcı rail; genişliği isCollapsed'e ve (genişken)
          sürükleyerek ayarlanan sidebarWidth'e göre değişiyor. Genişlik
          lg:w-[var(--sidebar-w)] ile CSS değişkeninden okunuyor — böylece
          mobildeki sabit w-72 bu değişkenden etkilenmiyor, sadece lg+'da geçerli. */}
      <aside
        style={{ "--sidebar-w": isCollapsed ? "4rem" : `${sidebarWidth}px` }}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-none flex-col justify-between bg-brand-800 p-4 shadow-xl lg:relative lg:inset-auto lg:z-auto lg:translate-x-0 lg:w-[var(--sidebar-w)] lg:p-3 lg:shadow-none ${
          isResizing ? "" : "transition-all duration-300"
        } ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {!isCollapsed && (
          <div
            onMouseDown={handleMouseDown}
            role="separator"
            aria-orientation="vertical"
            aria-label={t("nav.resizeSidebar")}
            className="absolute inset-y-0 right-0 z-10 hidden w-1.5 cursor-col-resize select-none hover:bg-accent-gold/50 lg:block"
          />
        )}
        <div className="flex flex-col gap-2">
          <button
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
            className={`mb-2 hidden items-center justify-center rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 lg:flex ${
              isCollapsed ? "" : "self-end"
            }`}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Ana Sayfa, Kullanıcı Profili, Makale Yaz ve Bildirimler kasıtlı
              olarak burada yok — profile Navbar'daki avatar (her ekran
              boyutunda), Ana Sayfa'ya Navbar (sm+)/BottomBar (mobil), Makale
              Yaz + Bildirimler'e ise Navbar (lg+, masaüstü) veya BottomBar
              (mobil) üzerinden zaten ulaşılabiliyor — her ikisi her genişlikte
              en az bir yerden erişilebilir olduğundan burada tekrar etmiyor. */}
          <Link to="/explore" onClick={onClose} className={linkClass}>
            <Compass size={18} /> <span className={labelClass}>{t("nav.explore")}</span>
          </Link>
          <Link to="/library" onClick={onClose} className={linkClass}>
            <Library size={18} /> <span className={labelClass}>{t("nav.library")}</span>
          </Link>
          <Link to="/notes" onClick={onClose} className={linkClass}>
            <StickyNote size={18} /> <span className={labelClass}>{t("nav.notes")}</span>
          </Link>

          {user?.role === "admin" && (
            <>
              <div className="my-2 border-t border-white/20" />
              <Link to="/admin" onClick={onClose} className={linkClass}>
                <ShieldCheck size={18} /> <span className={labelClass}>{t("nav.admin")}</span>
              </Link>
            </>
          )}

          <div className="my-2 border-t border-white/20" />

          {/* Çıkış, geri dönüşü olmayan bir eylem olduğu için diğer nötr
              linklerden renkle ayrılıyor (linkClass'ı override etmek yerine
              ayrı yazıldı — aynı utility'nin iki değerini bir arada
              kullanmak Tailwind'de hangisinin kazanacağı belirsiz olurdu). */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-medium text-accent-coral transition-colors hover:bg-accent-coral/10 ${
              isCollapsed ? "lg:w-11 lg:justify-center lg:gap-0 lg:px-0" : ""
            }`}
          >
            <LogOut size={18} /> <span className={labelClass}>{t("nav.logout")}</span>
          </button>
        </div>

        <div className="flex justify-center pb-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-accent-gold bg-white text-xs font-bold text-brand-900">
            LOGO
          </div>
        </div>
      </aside>
    </>
  );
}
