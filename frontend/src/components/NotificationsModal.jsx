import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, UserPlus, Bell, X } from "lucide-react";
import { getNotifications, markAsRead } from "../services/notificationService";
import Modal from "./UI/Modal";

const ICONS = {
  follow: UserPlus,
  favorite: Heart,
  comment: MessageCircle,
};

function buildMessage(notification) {
  const name = notification.fromUser?.username || "Bir kullanıcı";
  switch (notification.type) {
    case "follow":
      return `${name} seni takip etmeye başladı.`;
    case "favorite":
      return `${name} "${notification.article?.title || "bir makaleni"}" makaleni favoriledi.`;
    case "comment":
      return `${name} "${notification.article?.title || "bir makaleni"}" makalene yorum yaptı.`;
    default:
      return `${name} bir etkileşimde bulundu.`;
  }
}

function NotificationRow({ notification, onClick }) {
  const Icon = ICONS[notification.type] || Bell;
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
        notification.isRead ? "text-white/80 hover:bg-white/10" : "bg-accent-gold/10 hover:bg-accent-gold/15"
      }`}
    >
      <Icon size={16} className="mt-0.5 flex-none text-white/70" />
      <span className="flex-1 leading-snug">{buildMessage(notification)}</span>
      {!notification.isRead && <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-accent-gold" />}
    </button>
  );
}

function NotificationRowSkeleton() {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <div className="mt-0.5 h-4 w-4 flex-none animate-pulse rounded-full bg-white/10" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-full animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/10" />
      </div>
    </div>
  );
}

function NotificationsList({ isLoading, notifications, onNotificationClick }) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <NotificationRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <Bell size={22} className="text-white/40" />
        <p className="text-sm text-white/70">Henüz bildiriminiz yok.</p>
      </div>
    );
  }

  return (
    <div className="flex max-h-96 flex-col gap-1 overflow-y-auto">
      {notifications.map((notification) => (
        <NotificationRow
          key={notification._id}
          notification={notification}
          onClick={() => onNotificationClick(notification)}
        />
      ))}
    </div>
  );
}

// Masaüstünde zil artık Navbar'da (sağ üstte) olduğu için tam ekran modal
// bağlamdan koparıyordu — burada iki ayrı görünüm CSS breakpoint'iyle
// (JS'siz) seçiliyor: mobilde (<lg) tam ekran Modal aynen kalıyor, lg+'ta
// zilin altına çapalanmış, sayfanın geri kalanını karartmayan bir panel
// açılıyor. İkisi de aynı anda DOM'da ama sadece biri görünür olduğundan
// (display:none) veri/fetch mantığı bölünmüyor.
export default function NotificationsModal({ onClose, onSeen }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getNotifications().then((data) => {
      setNotifications(data);
      setIsLoading(false);

      const unread = data.filter((n) => !n.isRead);
      if (unread.length > 0) {
        Promise.all(unread.map((n) => markAsRead(n._id))).then(() => onSeen());
      } else {
        onSeen();
      }
    });
  }, [onSeen]);

  const handleClick = (notification) => {
    if (notification.article) {
      navigate(`/articles/${notification.article._id}`);
    } else if (notification.fromUser) {
      navigate(`/users/${notification.fromUser._id}`);
    }
    onClose();
  };

  return (
    <>
      <div className="lg:hidden">
        <Modal title="Bildirimler" onClose={onClose}>
          <NotificationsList isLoading={isLoading} notifications={notifications} onNotificationClick={handleClick} />
        </Modal>
      </div>

      <div className="fixed inset-0 z-50 hidden lg:block" onClick={onClose}>
        <div
          className="fixed right-4 top-[68px] w-96 max-w-[calc(100vw-2rem)] rounded-2xl bg-brand-800 p-4 shadow-xl sm:right-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Bildirimler</h2>
            <button
              onClick={onClose}
              aria-label="Kapat"
              className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <NotificationsList isLoading={isLoading} notifications={notifications} onNotificationClick={handleClick} />
        </div>
      </div>
    </>
  );
}
