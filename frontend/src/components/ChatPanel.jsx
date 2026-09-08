import { useEffect, useRef, useState } from "react";
import { Send, Image as ImageIcon, Smile } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  getOrCreateDashboardRoom,
  getOrCreateArticleRoom,
  getOrCreateDirectRoom,
  getRoomMessages,
  uploadChatImage,
} from "../services/chatService";
import { getArticleById } from "../services/articleService";
import { getPublicProfile } from "../services/userService";
import { formatTime } from "../utils/formatDate";

const EMOJIS = [
  "😀", "😂", "😍", "😎", "🥳", "😢", "😡", "👍", "👎", "🙏",
  "🔥", "🎉", "❤️", "💯", "😅", "🤔", "😴", "🤗", "😱", "🙌",
  "👏", "✨", "🌟", "💡", "📚", "☕", "🍕", "🎵", "⚡", "✅",
  "❌", "😉", "😜", "🤩", "🥰", "😤", "🙄", "😇", "🤝", "👀",
];

const TYPING_TIMEOUT_MS = 3000;
const TYPING_EMIT_THROTTLE_MS = 2000;

export default function ChatPanel({ roomRequest }) {
  const { user } = useAuth();
  const socket = useSocket();

  const [title, setTitle] = useState("Sohbet");
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [justActivatedMessage, setJustActivatedMessage] = useState("");

  const cleanupRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutsRef = useRef({});
  const lastTypingEmitRef = useRef(0);
  const hadErrorRef = useRef(false);

  useEffect(() => {
    if (!socket) return;

    let cancelled = false;
    setIsLoading(true);
    setError("");
    setMessages([]);
    setRoomId(null);
    setTypingUsers({});
    Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
    typingTimeoutsRef.current = {};

    const resolve = async () => {
      try {
        let roomRes;
        if (roomRequest.type === "dashboard") {
          roomRes = await getOrCreateDashboardRoom();
          setTitle("Dashboard Sohbeti");
        } else if (roomRequest.type === "article") {
          const [res, article] = await Promise.all([
            getOrCreateArticleRoom(roomRequest.articleId),
            getArticleById(roomRequest.articleId),
          ]);
          roomRes = res;
          setTitle(article.author?.username || "Makale Sohbeti");
        } else {
          const [res, profile] = await Promise.all([
            getOrCreateDirectRoom(roomRequest.targetUserId),
            getPublicProfile(roomRequest.targetUserId),
          ]);
          roomRes = res;
          setTitle(profile.username);
        }

        const history = await getRoomMessages(roomRes.roomId);
        if (cancelled) return;

        setRoomId(roomRes.roomId);
        setMessages(history);

        if (hadErrorRef.current) {
          hadErrorRef.current = false;
          setJustActivatedMessage(
            roomRequest.type === "article" ? "Artık bu yazarla mesajlaşabilirsiniz." : "Sohbet aktif."
          );
        }

        socket.emit("join_room", roomRequest, () => {});

        const handler = (data) => {
          if (data.roomId === roomRes.roomId) {
            setMessages((prev) => [...prev, data]);
          }
        };
        socket.on("new_message", handler);

        const typingHandler = (data) => {
          if (data.roomId !== roomRes.roomId || data.user._id === user?._id) return;
          setTypingUsers((prev) => ({ ...prev, [data.user._id]: data.user.username }));
          clearTimeout(typingTimeoutsRef.current[data.user._id]);
          typingTimeoutsRef.current[data.user._id] = setTimeout(() => {
            setTypingUsers((prev) => {
              const next = { ...prev };
              delete next[data.user._id];
              return next;
            });
          }, TYPING_TIMEOUT_MS);
        };
        socket.on("typing", typingHandler);

        cleanupRef.current = () => {
          socket.off("new_message", handler);
          socket.off("typing", typingHandler);
        };
      } catch (err) {
        if (!cancelled) {
          hadErrorRef.current = true;
          setError(err.response?.data?.message || "Sohbet yüklenemedi.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    resolve();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
    };
  }, [socket, roomRequest.type, roomRequest.articleId, roomRequest.targetUserId, retryKey]);

  // Bir makale kütüphaneye eklenince (ArticleCard/ArticleDetail toggle'ı bu event'i
  // yayınlıyor) o makalenin chat'i bu component'i yeniden mount etmeden aktifleşsin diye
  useEffect(() => {
    if (roomRequest.type !== "article") return;

    const handleLibraryChange = (e) => {
      if (e.detail.articleId === roomRequest.articleId && e.detail.isInLibrary) {
        setRetryKey((prev) => prev + 1);
      }
    };

    window.addEventListener("library:changed", handleLibraryChange);
    return () => window.removeEventListener("library:changed", handleLibraryChange);
  }, [roomRequest.type, roomRequest.articleId]);

  useEffect(() => {
    if (!justActivatedMessage) return;
    const timeout = setTimeout(() => setJustActivatedMessage(""), 4000);
    return () => clearTimeout(timeout);
  }, [justActivatedMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!socket || !roomId) return;

    const now = Date.now();
    if (now - lastTypingEmitRef.current > TYPING_EMIT_THROTTLE_MS) {
      socket.emit("typing", { roomId });
      lastTypingEmitRef.current = now;
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !roomId) return;

    setError("");
    socket.emit("send_message", { roomId, text: text.trim() }, (res) => {
      if (res?.error) setError(res.error);
    });
    setText("");
  };

  const handleEmojiSelect = (emoji) => {
    setText((prev) => prev + emoji);
    setIsEmojiOpen(false);
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !roomId) return;

    setIsUploadingImage(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { url } = await uploadChatImage(formData);

      socket.emit("send_message", { roomId, image: url }, (res) => {
        if (res?.error) setError(res.error);
      });
    } catch (err) {
      setError(err.response?.data?.message || "Görsel gönderilemedi.");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  if (!socket || isLoading) {
    return <p className="text-center text-sm text-white/70">Bağlanıyor...</p>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex items-center justify-between rounded-full bg-white px-4 py-2 text-sm font-medium text-brand-900">
        <span className="truncate">{title}</span>
        <span className="h-6 w-6 flex-none rounded-full bg-teal-500" />
      </div>

      {error && !roomId ? (
        <p className="flex-1 text-center text-sm text-white/70">{error}</p>
      ) : (
        <>
          {justActivatedMessage && (
            <p className="mb-2 rounded-full bg-teal-700 px-3 py-1.5 text-center text-xs font-medium text-white">
              {justActivatedMessage}
            </p>
          )}

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-white/60">Henüz mesaj yok, ilk mesajı sen gönder.</p>
            ) : (
              messages.map((message, i) => {
                const isOwn = message.sender?._id === user?._id;
                return (
                  <div
                    key={message._id || i}
                    className={`flex max-w-[85%] items-end gap-2 ${
                      isOwn ? "flex-row-reverse self-end" : "self-start"
                    }`}
                  >
                    <div className="flex h-6 w-6 flex-none items-center justify-center overflow-hidden rounded-full bg-teal-500 text-[10px] font-bold text-white">
                      {message.sender?.avatar ? (
                        <img src={message.sender.avatar} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        message.sender?.username?.[0]?.toUpperCase()
                      )}
                    </div>

                    <div
                      className={`min-w-0 rounded-2xl px-3 py-2 text-sm ${
                        isOwn ? "bg-accent-gold text-brand-900" : "bg-white/10 text-white"
                      }`}
                    >
                      <div className="mb-0.5 flex items-center gap-2 text-[10px] opacity-70">
                        <span className="font-semibold">{message.sender?.username}</span>
                        <span>{formatTime(message.createdAt)}</span>
                      </div>
                      {message.image && (
                        <img src={message.image} alt="" loading="lazy" className="mb-1 max-h-48 rounded-lg object-cover" />
                      )}
                      {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {Object.keys(typingUsers).length > 0 && (
            <p className="mt-1 text-xs italic text-white/60">
              {Object.values(typingUsers).join(", ")} yazıyor...
            </p>
          )}

          {error && <p className="mt-2 text-center text-xs text-accent-coral">{error}</p>}

          <div className="relative">
            {isEmojiOpen && (
              <div className="absolute bottom-12 left-0 z-10 grid max-h-40 w-64 grid-cols-8 gap-1 overflow-y-auto rounded-xl bg-white p-2 shadow-lg">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="rounded p-1 text-lg hover:bg-gray-100"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEmojiOpen((v) => !v)}
                aria-label="Emoji ekle"
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <Smile size={16} />
              </button>

              <label
                aria-label="Görsel gönder"
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 ${
                  isUploadingImage ? "opacity-60" : "cursor-pointer"
                }`}
              >
                <ImageIcon size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={isUploadingImage}
                  className="hidden"
                />
              </label>

              <input
                type="text"
                value={text}
                onChange={handleTextChange}
                placeholder="Mesajınızı buraya yazın..."
                className="flex-1 rounded-full bg-white px-4 py-2 text-sm text-brand-900 outline-none"
              />
              <button
                type="submit"
                aria-label="Gönder"
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-accent-gold text-brand-900 hover:brightness-95"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
