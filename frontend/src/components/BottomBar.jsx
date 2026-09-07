import { Link } from "react-router-dom";
import { Plus, Bell, MessageCircle } from "lucide-react";

export default function BottomBar({
  unreadCount = 0,
  onOpenNotifications,
  onOpenChat,
  showChat = false,
}) {
  return (
    <footer className="flex h-16 items-center justify-between bg-brand-700 px-4 sm:px-6">
      <Link
        to="/"
        className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-accent-gold bg-white text-xs font-bold text-brand-900"
      >
        LOGO
      </Link>

      <div className="flex items-center gap-3">
        {showChat && (
          <button
            onClick={onOpenChat}
            aria-label="Sohbet"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-900 text-white hover:brightness-110 transition-[filter] lg:hidden"
          >
            <MessageCircle size={20} />
          </button>
        )}
        <Link
          to="/write"
          aria-label="Makale yaz"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-900 text-white hover:bg-brand-800 transition-colors"
        >
          <Plus size={20} />
        </Link>
        <button
          onClick={onOpenNotifications}
          aria-label="Bildirimler"
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-accent-coral text-white hover:opacity-90 transition-opacity"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-gold text-[10px] font-bold text-brand-900">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </footer>
  );
}
