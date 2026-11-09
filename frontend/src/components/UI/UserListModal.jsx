import { Link } from "react-router-dom";
import Modal from "./Modal";

// Takipçiler/Takip Edilenler (UserPage.jsx, PublicProfile.jsx) ve beğenenler
// (ArticleDetail.jsx) aynı görünümü paylaşıyor — tek bir modalda, sadece
// başlık/veri/boş mesajı farklı.
export default function UserListModal({ title, users, emptyMessage, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      {users.length === 0 ? (
        <p className="text-center text-sm text-white/70">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((person) => (
            <Link
              key={person._id}
              to={`/users/${person._id}`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl bg-white/10 p-2 hover:bg-white/20"
            >
              <div className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-full bg-brand-600 text-xs font-semibold text-white">
                {person.avatar ? (
                  <img src={person.avatar} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  person.username?.[0]?.toUpperCase()
                )}
              </div>
              <p className="text-sm font-medium text-white">{person.username}</p>
            </Link>
          ))}
        </div>
      )}
    </Modal>
  );
}
