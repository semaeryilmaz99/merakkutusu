import { Link, useNavigate } from "react-router-dom";
import { User, Home, Compass, Library, NotebookPen, StickyNote, Bell, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const linkClass =
  "flex items-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-medium text-brand-900 hover:bg-accent-gold transition-colors";

export default function Sidebar({ isOpen, onClose, onOpenNotifications }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between bg-brand-800 p-4 shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-2">
          <Link to="/userpage" onClick={onClose} className={linkClass}>
            <User size={18} /> Kullanıcı Profili
          </Link>
          <Link to="/" onClick={onClose} className={linkClass}>
            <Home size={18} /> Ana Sayfa
          </Link>
          <Link to="/explore" onClick={onClose} className={linkClass}>
            <Compass size={18} /> Keşfet
          </Link>
          <Link to="/library" onClick={onClose} className={linkClass}>
            <Library size={18} /> Kütüphane
          </Link>
          <Link to="/notes" onClick={onClose} className={linkClass}>
            <StickyNote size={18} /> Notlarım
          </Link>

          <div className="my-2 border-t border-white/20" />

          <Link to="/write" onClick={onClose} className={linkClass}>
            <NotebookPen size={18} /> Makale Yaz
          </Link>
          <button onClick={onOpenNotifications} className={linkClass}>
            <Bell size={18} /> Bildirimler
          </button>

          {user?.role === "admin" && (
            <>
              <div className="my-2 border-t border-white/20" />
              <Link to="/admin" onClick={onClose} className={linkClass}>
                <ShieldCheck size={18} /> Admin Paneli
              </Link>
            </>
          )}

          <div className="my-2 border-t border-white/20" />

          <button onClick={handleLogout} className={linkClass}>
            <LogOut size={18} /> Çıkış Yap
          </button>
        </div>

        <div className="flex justify-center pb-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-accent-gold bg-white text-xs font-bold text-brand-900">
            LOGO
          </div>
        </div>
      </aside>
    </>
  );
}
