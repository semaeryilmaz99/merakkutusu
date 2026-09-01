import { useEffect, useState } from "react";
import { Outlet, useMatch } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import RightPanel from "./RightPanel";
import BottomBar from "./BottomBar";
import CreateArticleModal from "./CreateArticleModal";
import NotificationsModal from "./NotificationsModal";
import { getNotifications } from "../services/notificationService";

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // "createArticle" | "notifications" | null
  const [unreadCount, setUnreadCount] = useState(0);
  const isArticlePage = useMatch("/articles/:id");

  useEffect(() => {
    getNotifications().then((data) => {
      setUnreadCount(data.filter((n) => !n.isRead).length);
    });
  }, []);

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

        <RightPanel variant={isArticlePage ? "chat" : "library"} />
      </div>

      <BottomBar
        unreadCount={unreadCount}
        onOpenCreateArticle={() => setActiveModal("createArticle")}
        onOpenNotifications={() => setActiveModal("notifications")}
      />

      {activeModal === "createArticle" && <CreateArticleModal onClose={closeModal} />}

      {activeModal === "notifications" && (
        <NotificationsModal onClose={closeModal} onSeen={() => setUnreadCount(0)} />
      )}
    </div>
  );
}
