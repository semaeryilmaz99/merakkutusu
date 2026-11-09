import { useEffect, useRef, useState } from "react";
import { Send, Image as ImageIcon, Smile, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useOnboarding } from "../context/OnboardingContext";
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
  const { t } = useTranslation("chat");
  const { user } = useAuth();
  const socket = useSocket();
  const { isChatHintVisible, dismissChatHint } = useOnboarding();

  const [title, setTitle] = useState(t("defaultTitle"));
  const [isAuthorView, setIsAuthorView] = useState(false);
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
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const cleanupRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutsRef = useRef({});
  const lastTypingEmitRef = useRef(0);
  const hadErrorRef = useRef(false);
  const oldestPageRef = useRef(1);
  // "Daha eski mesajları yükle" sonrası otomatik en-alta-kaydırmayı bir
  // seferliğine atlamak için — o durumda handleLoadOlder kendi scroll
  // pozisyonunu geri yüklüyor.
  const skipAutoScrollRef = useRef(false);
  // Kullanıcı yukarı kaydırıp eski mesajları okurken yeni bir mesaj gelirse
  // WhatsApp gibi ekranı aşağı ZORLAMIYORUZ — sadece "aşağı in" butonu
  // çıkıyor. Bu ref, scroll event'i her tetiklendiğinde güncelleniyor.
  const isNearBottomRef = useRef(true);

  // Yeni mesaj gelince (ya da ilk yüklemede) sohbet en alta kaysın, ama
  // "daha eski mesajları yükle" sonrası KAYMASIN — kullanıcı tam o anda
  // okuduğu mesajın üzerinden kopmamalı.
  const mergeMessages = (prev, incoming) => {
    const byId = new Map(prev.map((m) => [m._id, m]));
    incoming.forEach((m) => byId.set(m._id, m));
    return [...byId.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  };

  useEffect(() => {
    if (!socket) return;

    let cancelled = false;
    setIsLoading(true);
    setError("");
    setMessages([]);
    setRoomId(null);
    setTypingUsers({});
    setIsAuthorView(false);
    setHasOlderMessages(false);
    setShowScrollToBottom(false);
    isNearBottomRef.current = true;
    oldestPageRef.current = 1;
    Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
    typingTimeoutsRef.current = {};

    const resolve = async () => {
      try {
        let roomRes;
        if (roomRequest.type === "dashboard") {
          roomRes = await getOrCreateDashboardRoom();
          setTitle(t("dashboardTitle"));
        } else if (roomRequest.type === "article") {
          const [res, article] = await Promise.all([
            getOrCreateArticleRoom(roomRequest.articleId),
            getArticleById(roomRequest.articleId),
          ]);
          roomRes = res;
          setTitle(article.author?.username || t("articleTitleFallback"));
          // Yazar kendi makalesinde "kütüphaneye ekle" ipucunu görmemeli —
          // backend zaten yazar için bu şartı aramıyor (resolveChatRoom.js).
          setIsAuthorView(Boolean(article.author?._id && article.author._id === user?._id));
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
        setMessages(history.messages);
        setHasOlderMessages(history.page < history.totalPages);

        if (hadErrorRef.current) {
          hadErrorRef.current = false;
          setJustActivatedMessage(
            roomRequest.type === "article" ? t("articleActivated") : t("activated")
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

        // Ağ kopması (wifi geçişi, kısa kesinti vb.) sonrası Socket.IO client
        // otomatik yeniden bağlanır, ama server bağlantısı koptuğu anda soketi
        // bulunduğu TÜM odalardan düşürür — "connect" event'i her başarılı
        // bağlantıda (ilkinde VE her reconnect'te) tetiklenir, bu yüzden odaya
        // burada tekrar join oluyoruz. Ayrıca kopukluk sırasında kaçırılmış
        // olabilecek mesajları yakalamak için en son sayfayı yeniden çekip
        // mevcut listeyle (id'ye göre) birleştiriyoruz.
        const handleReconnect = () => {
          socket.emit("join_room", roomRequest, async () => {
            try {
              const latest = await getRoomMessages(roomRes.roomId);
              if (cancelled) return;
              setMessages((prev) => mergeMessages(prev, latest.messages));
            } catch {
              // Resync başarısız olursa sessizce geç — yeni mesajlar zaten
              // "new_message" event'iyle akmaya devam edecek, kritik değil.
            }
          });
        };
        socket.on("connect", handleReconnect);

        cleanupRef.current = () => {
          socket.off("new_message", handler);
          socket.off("typing", typingHandler);
          socket.off("connect", handleReconnect);
        };
      } catch (err) {
        if (!cancelled) {
          hadErrorRef.current = true;
          setError(err.response?.data?.message || t("loadFailed"));
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
    // "Daha eski mesajları yükle" sonrası en alta kaymamalı — kullanıcı o an
    // okuduğu yerden kopmasın diye bu durumda handleLoadOlder kendi scroll
    // pozisyonunu geri yüklüyor.
    if (skipAutoScrollRef.current) {
      skipAutoScrollRef.current = false;
      return;
    }
    // Kullanıcı yukarı kaydırıp eski mesajlara bakıyorsa yeni mesaj gelince
    // ekranı aşağı zorlamıyoruz (WhatsApp'taki gibi) — sadece en alttaysa
    // otomatik kayıyor.
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mesaj alanının scroll pozisyonunu izleyip "aşağı in" butonunu gösterip
  // gizliyor. useEffect + addEventListener yerine doğrudan onScroll kullanıyoruz
  // çünkü container ilk render'da (isLoading=true iken) henüz DOM'da yok —
  // boş deps'li bir effect o anda ref'i null bulup bir daha hiç tekrar
  // çalışmıyordu, buton hiçbir zaman belirmiyordu.
  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom < 120;
    isNearBottomRef.current = nearBottom;
    setShowScrollToBottom(!nearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLoadOlder = async () => {
    if (!roomId || isLoadingOlder) return;
    setIsLoadingOlder(true);
    const container = messagesContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;
    try {
      const nextPage = oldestPageRef.current + 1;
      const older = await getRoomMessages(roomId, nextPage);
      oldestPageRef.current = nextPage;
      skipAutoScrollRef.current = true;
      setMessages((prev) => mergeMessages(prev, older.messages));
      setHasOlderMessages(nextPage < older.totalPages);
      requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight - prevScrollHeight;
      });
    } finally {
      setIsLoadingOlder(false);
    }
  };

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
      setError(err.response?.data?.message || t("imageSendFailed"));
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  if (!socket || isLoading) {
    return <p className="text-center text-sm text-white/70">{t("connecting")}</p>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {roomRequest.type === "article" && !isAuthorView && isChatHintVisible && (
        <div className="mb-3 rounded-xl bg-white/10 p-3 text-xs text-white">
          <p>{t("libraryHint")}</p>
          <button
            type="button"
            onClick={dismissChatHint}
            className="mt-2 font-medium text-accent-gold hover:underline"
          >
            {t("understood")}
          </button>
        </div>
      )}

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

          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto"
            >
              {hasOlderMessages && (
                <button
                  type="button"
                  onClick={handleLoadOlder}
                  disabled={isLoadingOlder}
                  className="mx-auto mb-1 flex-none rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 disabled:opacity-60"
                >
                  {isLoadingOlder ? t("loadingEarlier") : t("loadEarlier")}
                </button>
              )}
              {messages.length === 0 ? (
                <p className="text-center text-sm text-white/60">{t("noMessages")}</p>
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

            <button
              type="button"
              onClick={scrollToBottom}
              aria-label={t("scrollToBottomAria")}
              tabIndex={showScrollToBottom ? 0 : -1}
              className={`absolute bottom-2 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-white text-brand-900 shadow-lg transition-all duration-200 ease-out hover:bg-gray-100 ${
                showScrollToBottom
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-3 opacity-0"
              }`}
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {Object.keys(typingUsers).length > 0 && (
            <p className="mt-1 text-xs italic text-white/60">
              {t("typing", { names: Object.values(typingUsers).join(", ") })}
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
                aria-label={t("emojiAria")}
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <Smile size={16} />
              </button>

              <label
                aria-label={t("imageAria")}
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
                placeholder={t("placeholder")}
                className="flex-1 rounded-full bg-white px-4 py-2 text-sm text-brand-900 outline-none"
              />
              <button
                type="submit"
                aria-label={t("sendAria")}
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
