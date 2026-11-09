import { Link, NavLink } from "react-router-dom";
import { Menu, NotebookPen, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import OnboardingHint from "./OnboardingHint";
import LanguageSwitcher from "./LanguageSwitcher";

const navLinkClass = ({ isActive }) =>
  `rounded-full px-5 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-accent-gold text-brand-900"
      : "bg-white/10 text-white hover:bg-white/20"
  }`;

export default function Navbar({ onOpenSidebar, onOpenNotifications, unreadCount = 0 }) {
  const { t } = useTranslation("common");
  const { user } = useAuth();

  return (
    // 3 kolonlu grid (sol/sağ 1fr, orta auto) ile Ana Sayfa/Keşfet gerçekten
    // ortalanıyor — justify-between kullansaydık sol (hamburger, dar) ve sağ
    // (ikon grubu, geniş) asimetrik olduğu için orta içerik tam merkezde
    // durmazdı (lg+'da hamburger de kaybolunca bu kayma iyice belirginleşti).
    <nav className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-2 bg-brand-900 px-4 sm:px-6">
      <div className="flex items-center">
        {/* lg+'da Sidebar artık kalıcı bir rail (bkz. Sidebar.jsx) — açmaya
            gerek kalmadığı için buton sadece mobilde/tablette gösteriliyor. */}
        <button
          onClick={onOpenSidebar}
          aria-label={t("nav.openMenu")}
          className="rounded-md p-2 text-white hover:bg-white/10 lg:hidden"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="hidden gap-3 sm:flex">
        <NavLink to="/" end className={navLinkClass}>
          {t("nav.home")}
        </NavLink>
        <OnboardingHint stepId="explore" bubbleBreakpoint="hidden lg:block">
          <NavLink to="/explore" className={navLinkClass}>
            {t("nav.explore")}
          </NavLink>
        </OnboardingHint>
      </div>

      <div className="flex items-center justify-self-end gap-2">
        {/* Masaüstünde (lg+) BottomBar gizli olduğu için Makale Yaz/Bildirimler'e
            buradan da erişim şart — mobilde bu ikisi zaten BottomBar'da olduğundan
            burada sadece lg+ gösteriliyor, aynı hedefe iki yerden erişim tekrarı
            oluşmasın diye. */}
        <div className="hidden items-center gap-2 lg:flex">
          <OnboardingHint stepId="write" bubbleBreakpoint="hidden lg:block">
            <Link
              to="/write"
              aria-label={t("nav.write")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <NotebookPen size={18} />
            </Link>
          </OnboardingHint>
          <button
            onClick={onOpenNotifications}
            aria-label={t("nav.notifications")}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-gold text-[10px] font-bold text-brand-900">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        <LanguageSwitcher dark />

        <OnboardingHint stepId="profile" align="right">
          <Link
            to="/userpage"
            aria-label={t("nav.profile")}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-accent-gold bg-white/20 text-sm font-semibold text-white"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              user?.username?.[0]?.toUpperCase()
            )}
          </Link>
        </OnboardingHint>
      </div>
    </nav>
  );
}
