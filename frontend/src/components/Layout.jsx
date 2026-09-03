import { useEffect, useState } from "react";
import { Outlet, useMatch } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import RightPanel from "./RightPanel";
import BottomBar from "./BottomBar";
import ArticleFormModal from "./ArticleFormModal";
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
  const [activeModal, setActiveModal] = useState(null); // "createArticle" | "notifications" | null
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isHome = useMatch("/");
  const articleMatch = useMatch("/articles/:id");
  const profileMatch = useMatch("/users/:id");

  let rightPanelProps = { variant: "library" };
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

  return (
    <div className="flex h-screen flex-col">
      <Navbar onOpenSidebar={() => setIsSidebarOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenCreateArticle={() => {
            setIsSidebarOpen(false);
            setActiveModal("createArticle");
          }}
          onOpenNotifications={() => {
            setIsSidebarOpen(false);
            setActiveModal("notifications");
          }}
        />

        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
          <Outlet />
        </main>

        <RightPanel {...rightPanelProps} />
      </div>

      <BottomBar
        unreadCount={unreadCount}
        onOpenCreateArticle={() => setActiveModal("createArticle")}
        onOpenNotifications={() => setActiveModal("notifications")}
        onOpenChat={() => setIsMobileChatOpen(true)}
        showChat={Boolean(mobileChatRoomRequest)}
      />

      {activeModal === "createArticle" && <ArticleFormModal onClose={closeModal} />}

      {activeModal === "notifications" && (
        <NotificationsModal onClose={closeModal} onSeen={() => setUnreadCount(0)} />
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
