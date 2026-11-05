import { Link, NavLink } from "react-router-dom";
import { Menu, Bell, Eye, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWriteHeader } from "../context/WriteHeaderContext";
import { formatTime } from "../utils/formatDate";
import WriteOnboardingHint from "./WriteOnboardingHint";

const navLinkClass = ({ isActive }) =>
  `rounded-full px-5 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-accent-gold text-brand-900" : "bg-white/10 text-white hover:bg-white/20"
  }`;

// Navbar.jsx'in /write'taki karşılığı — aynı renkler (bg-brand-900, accent-gold)
// ve aynı buton boyutları (h-10 w-10 ikon butonları, rounded-full px-5 py-2
// pill'ler) kullanılıyor; sayfanın geri kalanı kendi Editorial diliyle kalsa
// da üst çubuk uygulamanın geneliyle görsel olarak kopuk durmasın diye.
// WriteArticle.jsx'in kendi Önizle/Yayınla/otomatik-kaydetme durumunu
// WriteHeaderContext üzerinden okur, çünkü Layout.jsx bu ikisini <Outlet/>'in
// yanında, ayrı bir dalda render ediyor (prop ile aktarılamaz). Diğer
// sayfalarda bu bileşen hiç mount olmaz, Navbar.jsx aynen kullanılmaya devam eder.
export default function WriteNavHeader({ onOpenSidebar, onOpenNotifications, unreadCount = 0 }) {
  const { user } = useAuth();
  const { actions } = useWriteHeader();

  const previewMode = actions?.previewMode ?? "edit";

  return (
    <nav className="flex h-16 flex-wrap items-center justify-between gap-2 bg-brand-900 px-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onOpenSidebar}
          aria-label="Menüyü aç"
          className="rounded-md p-2 text-white hover:bg-white/10"
        >
          <Menu size={24} />
        </button>

        <div className="hidden gap-3 sm:flex">
          <NavLink to="/" end className={navLinkClass}>
            Ana Sayfa
          </NavLink>
          <NavLink to="/explore" className={navLinkClass}>
            Keşfet
          </NavLink>
        </div>

        <div className="hidden items-center gap-2 pl-2 text-xs text-white/60 lg:flex">
          <span className="h-2 w-2 flex-none rounded-full bg-teal-500" aria-hidden="true" />
          <span>
            {actions?.lastSavedAt ? `${formatTime(actions.lastSavedAt)} · otomatik kaydedildi` : "henüz kaydedilmedi"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={actions?.onTogglePreview}
          disabled={!actions}
          className="hidden items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50 sm:flex"
        >
          <Eye size={16} />
          {previewMode === "preview" ? "Düzenle" : "Önizle"}
        </button>

        <WriteOnboardingHint stepId="write-publish">
          <button
            type="button"
            onClick={actions?.onSubmit}
            disabled={!actions || actions.isSubmitting}
            className="flex items-center gap-2 rounded-full bg-accent-gold px-5 py-2 text-sm font-medium text-brand-900 transition-colors hover:brightness-95 disabled:opacity-50"
          >
            <Send size={16} />
            {actions?.isSubmitting ? "Yayınlanıyor…" : "Yayınla"}
          </button>
        </WriteOnboardingHint>

        <button
          onClick={onOpenNotifications}
          aria-label="Bildirimler"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-gold text-[10px] font-bold text-brand-900">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <Link
          to="/userpage"
          aria-label="Profilim"
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-accent-gold bg-white/20 text-sm font-semibold text-white"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            user?.username?.[0]?.toUpperCase()
          )}
        </Link>
      </div>
    </nav>
  );
}
