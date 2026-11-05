import { useCallback, useEffect, useState } from "react";
import { Outlet, useMatch } from "react-router-dom";
import Navbar from "./Navbar";
import WriteNavHeader from "./WriteNavHeader";
import Sidebar from "./Sidebar";
import RightPanel from "./RightPanel";
import BottomBar from "./BottomBar";
import NotificationsModal from "./NotificationsModal";
import IncomingMessageToast from "./IncomingMessageToast";
import LibraryToast from "./LibraryToast";
import Modal from "./UI/Modal";
import ChatPanel from "./ChatPanel";
import { getNotifications } from "../services/notificationService";
import { useSocket } from "../context/SocketContext";

export default function Layout() {
  const socket = useSocket();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // "notifications" | null
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isHome = useMatch("/");
  const articleMatch = useMatch("/articles/:id");
  const profileMatch = useMatch("/users/:id");
  const isWrite = useMatch("/write");

  // Yazarken kütüphaneyi göstermenin bir faydası yok — kaynak önerisi zaten
  // editörün kendi içinde (SourceSuggestions), kütüphane paneli burada sadece
  // dikkat dağıtıp editöre ayrılabilecek genişliği alıyordu.
  let rightPanelProps = isWrite ? null : { variant: "library" };
  let mobileChatRoomRequest = null;
  if (articleMatch) {
    const roomRequest = { type: "article", articleId: articleMatch.params.id };
    rightPanelProps = { variant: "chat", roomRequest };
    mobileChatRoomRequest = roomRequest;
  } else if (profileMatch) {
    const roomRequest = { type: "direct", targetUserId: profileMatch.params.id };
    rightPanelProps = { variant: "chat", roomRequest };
    mobileChatRoomRequest = roomRequest;
  } else if (isHome) {
    rightPanelProps = { variant: "libraryWithChat" };
    mobileChatRoomRequest = { type: "dashboard" };
  }

  useEffect(() => {
    getNotifications().then((data) => {
      setUnreadCount(data.filter((n) => !n.isRead).length);
    });
  }, []);

  // Favori/yorum/takip bildirimleri artık kişisel soket odasına da yayınlanıyor
  // (backend: getIo()?.to(`user:<id>`).emit("notification:new")) — rozet sayfa
  // yenilenmeden canlı güncellensin diye.
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = () => setUnreadCount((prev) => prev + 1);
    socket.on("notification:new", handleNewNotification);
    return () => socket.off("notification:new", handleNewNotification);
  }, [socket]);

  const closeModal = () => setActiveModal(null);
  // NotificationsModal bu callback'i bir useEffect bağımlılığında kullanıyor —
  // inline arrow function her Layout render'ında yeni bir referans olacağından
  // (ör. socket'ten gelen bir bildirimle unreadCount değişip Layout yeniden
  // render olduğunda), modal her seferinde tekrar mount olmamış olsa bile
  // effect'i yeniden tetikleyip bildirimleri gereksiz yere tekrar çekiyordu.
  const handleNotificationsSeen = useCallback(() => setUnreadCount(0), []);

  return (
    <div className="flex h-screen flex-col">
      {isWrite ? (
        <WriteNavHeader
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenNotifications={() => setActiveModal("notifications")}
          unreadCount={unreadCount}
        />
      ) : (
        <Navbar
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenNotifications={() => setActiveModal("notifications")}
          unreadCount={unreadCount}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main
          className={`flex-1 overflow-y-auto p-4 sm:p-6 ${
            isWrite ? "bg-ed-bg font-ed-sans lg:overflow-hidden" : "bg-gray-100"
          }`}
        >
          <Outlet />
        </main>

        {rightPanelProps && <RightPanel {...rightPanelProps} />}
      </div>

      <BottomBar
        unreadCount={unreadCount}
        onOpenNotifications={() => setActiveModal("notifications")}
        onOpenChat={() => setIsMobileChatOpen(true)}
        showChat={Boolean(mobileChatRoomRequest)}
      />

      {activeModal === "notifications" && (
        <NotificationsModal onClose={closeModal} onSeen={handleNotificationsSeen} />
      )}

      {isMobileChatOpen && mobileChatRoomRequest && (
        <Modal title="Sohbet" onClose={() => setIsMobileChatOpen(false)}>
          <div className="flex h-[70vh] flex-col">
            <ChatPanel roomRequest={mobileChatRoomRequest} />
          </div>
        </Modal>
      )}

      <IncomingMessageToast />
      <LibraryToast />
    </div>
  );
}
