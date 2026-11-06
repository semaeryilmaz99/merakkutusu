import { Link } from "react-router-dom";
import { Home, Compass, Plus, Bell, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import OnboardingHint from "./OnboardingHint";

// Masaüstünde (lg+) Navbar (Ana Sayfa/Keşfet/profil) ve RightPanel zaten tüm
// bu erişimi karşılıyor — BottomBar sadece mobilin birincil sekme çubuğu.
// Önceden dıştaki <footer>'da bu kısıt eksikti, masaüstünde de görünüp
// Navbar/Sidebar ile aynı hedefleri (Ana Sayfa, Yazı Yaz, Bildirimler)
// tekrarlıyordu.
export default function BottomBar({
  unreadCount = 0,
  onOpenNotifications,
  onOpenChat,
  showChat = false,
}) {
  const { t } = useTranslation("common");

  return (
    <footer className="flex h-16 items-center justify-around bg-brand-700 px-4 lg:hidden">
      <Link
        to="/"
        aria-label={t("nav.home")}
        className="flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
      >
        <Home size={20} />
      </Link>

      <OnboardingHint stepId="explore" placement="top" bubbleBreakpoint="lg:hidden">
        <Link
          to="/explore"
          aria-label={t("nav.explore")}
          className="flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
        >
          <Compass size={20} />
        </Link>
      </OnboardingHint>

      {showChat && (
        <button
          onClick={onOpenChat}
          aria-label={t("nav.chat")}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-900 text-white hover:brightness-110 transition-[filter]"
        >
          <MessageCircle size={20} />
        </button>
      )}

      <OnboardingHint stepId="write" placement="top" bubbleBreakpoint="lg:hidden">
        <Link
          to="/write"
          aria-label={t("nav.write")}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-900 text-white hover:bg-brand-800 transition-colors"
        >
          <Plus size={20} />
        </Link>
      </OnboardingHint>

      <button
        onClick={onOpenNotifications}
        aria-label={t("nav.notifications")}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-accent-coral text-white hover:opacity-90 transition-opacity"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-gold text-[10px] font-bold text-brand-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </footer>
  );
}
