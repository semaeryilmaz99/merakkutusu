import { useEffect, useRef, useState } from "react";
import { useMatch } from "react-router-dom";
import { X } from "lucide-react";
import { useIncomingMessages } from "../context/SocketContext";
import Modal from "./UI/Modal";
import ChatPanel from "./ChatPanel";

const AUTO_DISMISS_MS = 6000;

export default function IncomingMessageToast() {
  const { incomingMessages, dismissIncomingMessage } = useIncomingMessages();
  const profileMatch = useMatch("/users/:id");
  const [replyTarget, setReplyTarget] = useState(null);

  const visibleMessages = incomingMessages.filter(
    (m) => m.sender._id !== profileMatch?.params.id
  );

  // Mesaj başına TEK bir zamanlayıcı — id'ye göre bir Map'te tutuluyor.
  // Önceki hali `incomingMessages` dizisinin TAMAMINA bağımlıydı: yeni bir
  // mesaj gelince (ya da biri kapatılınca) dizi referansı değiştiği için
  // TÜM zamanlayıcılar sıfırdan kuruluyordu — art arda mesaj geldiğinde
  // hiçbir toast asla 6sn'de otomatik kapanmıyordu. Burada sadece henüz
  // zamanlayıcısı olmayan (yeni gelen) mesajlar için timer kuruluyor.
  const timersRef = useRef(new Map());

  useEffect(() => {
    const currentIds = new Set(incomingMessages.map((m) => m.id));

    incomingMessages.forEach((m) => {
      if (timersRef.current.has(m.id)) return;
      const timerId = setTimeout(() => {
        dismissIncomingMessage(m.id);
        timersRef.current.delete(m.id);
      }, AUTO_DISMISS_MS);
      timersRef.current.set(m.id, timerId);
    });

    // Elle kapatılmış (listeden çıkmış) mesajların zamanlayıcısını temizle
    timersRef.current.forEach((timerId, id) => {
      if (!currentIds.has(id)) {
        clearTimeout(timerId);
        timersRef.current.delete(id);
      }
    });
  }, [incomingMessages, dismissIncomingMessage]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleOpenReply = (message) => {
    setReplyTarget({ _id: message.sender._id, username: message.sender.username });
    dismissIncomingMessage(message.id);
  };

  return (
    <>
      <div className="fixed left-1/2 top-4 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
        {visibleMessages.map((message) => (
          <div
            key={message.id}
            className="flex items-start gap-2 rounded-2xl bg-brand-900 p-3 text-white shadow-xl"
          >
            <button
              onClick={() => handleOpenReply(message)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="text-xs font-semibold text-accent-gold">{message.sender.username}</p>
              <p className="truncate text-sm">{message.text}</p>
            </button>
            <button
              onClick={() => dismissIncomingMessage(message.id)}
              aria-label="Kapat"
              className="flex-none rounded-full p-1 hover:bg-white/10"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {replyTarget && (
        <Modal title={replyTarget.username} onClose={() => setReplyTarget(null)}>
          <div className="flex h-96 flex-col">
            <ChatPanel roomRequest={{ type: "direct", targetUserId: replyTarget._id }} />
          </div>
        </Modal>
      )}
    </>
  );
}
