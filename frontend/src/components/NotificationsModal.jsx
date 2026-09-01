import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, UserPlus, Bell } from "lucide-react";
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
    <Modal title="Bildirimler" onClose={onClose}>
      {isLoading ? (
        <p className="text-center text-sm text-white/70">Yükleniyor...</p>
      ) : notifications.length === 0 ? (
        <p className="text-center text-sm text-white/70">Henüz bildiriminiz yok.</p>
      ) : (
        <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
          {notifications.map((notification) => {
            const Icon = ICONS[notification.type] || Bell;
            return (
              <button
                key={notification._id}
                onClick={() => handleClick(notification)}
                className={`flex items-center gap-3 rounded-full px-4 py-3 text-left text-sm transition-colors ${
                  notification.isRead
                    ? "bg-white/10 text-white/80 hover:bg-white/20"
                    : "bg-accent-gold text-brand-900 hover:brightness-95"
                }`}
              >
                <Icon size={16} className="flex-none" />
                <span className="truncate">{buildMessage(notification)}</span>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
