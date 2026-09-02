import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (incomingMessages.length === 0) return;
    const timers = incomingMessages.map((m) =>
      setTimeout(() => dismissIncomingMessage(m.id), AUTO_DISMISS_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, [incomingMessages, dismissIncomingMessage]);

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
