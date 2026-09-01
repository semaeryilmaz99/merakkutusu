import { Link, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navLinkClass = ({ isActive }) =>
  `rounded-full px-5 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-accent-gold text-brand-900"
      : "bg-white/10 text-white hover:bg-white/20"
  }`;

export default function Navbar({ onOpenSidebar }) {
  const { user } = useAuth();

  return (
    <nav className="flex h-16 items-center justify-between bg-brand-900 px-4 sm:px-6">
      <button
        onClick={onOpenSidebar}
        aria-label="Menüyü aç"
        className="rounded-md p-2 text-white hover:bg-white/10"
      >
        <Menu size={24} />
      </button>

      <div className="hidden gap-3 sm:flex">
        <NavLink to="/" end className={navLinkClass}>
          Ana Sayfa
        </NavLink>
        <NavLink to="/explore" className={navLinkClass}>
          Keşfet
        </NavLink>
      </div>

      <Link
        to="/userpage"
        aria-label="Profilim"
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-accent-gold bg-white/20 text-sm font-semibold text-white"
      >
        {user?.avatar ? (
          <img src={user.avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          user?.username?.[0]?.toUpperCase()
        )}
      </Link>
    </nav>
  );
}
