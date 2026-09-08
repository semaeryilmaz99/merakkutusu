import { useEffect, useState } from "react";
import { ShieldCheck, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getAllUsers, deleteUser, getUserActivity } from "../services/adminService";
import { formatShortDate } from "../utils/formatDate";
import Modal from "../components/UI/Modal";

export default function AdminPanel() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [activityUserId, setActivityUserId] = useState(null);

  useEffect(() => {
    if (currentUser?.role !== "admin") return;
    setIsLoading(true);
    getAllUsers(page)
      .then((data) => {
        setUsers(data.users);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
      })
      .finally(() => setIsLoading(false));
  }, [currentUser?.role, page]);

  const handleDelete = async (id) => {
    await deleteUser(id);
    setUsers((prev) => prev.filter((u) => u._id !== id));
    setConfirmingId(null);
  };

  if (currentUser?.role !== "admin") {
    return <p className="text-sm text-accent-coral">Bu sayfaya erişim yetkiniz yok.</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500">Yükleniyor...</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-teal-500 bg-white">
      <div className="flex items-center gap-2 bg-gray-100 px-4 py-3">
        <ShieldCheck size={18} className="text-brand-700" />
        <h1 className="text-lg font-semibold text-brand-900">
          Admin Paneli — Kullanıcılar <span className="text-sm font-normal text-gray-400">({totalCount})</span>
        </h1>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
              <th className="px-4 py-2">Kullanıcı Adı</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Rol</th>
              <th className="px-4 py-2">Doğrulanmış</th>
              <th className="px-4 py-2">Katılım</th>
              <th className="px-4 py-2">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-gray-50 text-brand-900">
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      u.role === "admin" ? "bg-accent-gold text-brand-900" : "bg-gray-100 text-brand-700"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">{u.isVerified ? "Evet" : "Hayır"}</td>
                <td className="px-4 py-3 text-gray-500">
                  {formatShortDate(u.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActivityUserId(u._id)}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-gray-200"
                    >
                      Aktivite
                    </button>

                    {u._id === currentUser._id ? null : confirmingId === u._id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(u._id)}
                          className="rounded-full bg-accent-coral px-2 py-1 text-xs font-semibold text-white"
                        >
                          Evet, sil
                        </button>
                        <button
                          onClick={() => setConfirmingId(null)}
                          className="rounded-full bg-gray-200 px-2 py-1 text-xs text-brand-900"
                        >
                          Vazgeç
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingId(u._id)}
                        aria-label={`${u.username} kullanıcısını sil`}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-brand-700 hover:bg-accent-coral hover:text-white"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 border-t border-gray-100 px-4 py-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Önceki sayfa"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-brand-700 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-gray-500">
            Sayfa {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Sonraki sayfa"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-brand-700 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {activityUserId && (
        <UserActivityModal userId={activityUserId} onClose={() => setActivityUserId(null)} />
      )}
    </div>
  );
}

function UserActivityModal({ userId, onClose }) {
  const [activity, setActivity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getUserActivity(userId)
      .then(setActivity)
      .finally(() => setIsLoading(false));
  }, [userId]);

  return (
    <Modal title="Kullanıcı Aktivitesi" onClose={onClose}>
      {isLoading ? (
        <p className="text-center text-sm text-white/70">Yükleniyor...</p>
      ) : (
        <div className="flex flex-col gap-4 text-white">
          <p className="text-sm font-semibold">{activity.user.username}</p>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-lg font-bold">{activity.articleCount}</p>
              <p>makale</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-lg font-bold">{activity.receivedFavorites}</p>
              <p>alınan favori</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-lg font-bold">{activity.receivedComments}</p>
              <p>alınan yorum</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-lg font-bold">{activity.madeComments}</p>
              <p>yaptığı yorum</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-white/70">Son Makaleleri</p>
            {activity.recentArticles.length === 0 ? (
              <p className="text-xs text-white/50">Henüz makale yok.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {activity.recentArticles.map((a) => (
                  <div key={a._id} className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 text-xs">
                    <span className="truncate">{a.title}</span>
                    <span className="flex-none text-white/60">
                      {a.favorites} favori · {a.comments} yorum
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
