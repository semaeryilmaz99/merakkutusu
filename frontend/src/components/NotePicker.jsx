import { useEffect, useState } from "react";
import { FileText, Image as ImageIcon, Check, Plus, Sparkles } from "lucide-react";
import { getMyNotes } from "../services/noteService";
import Modal from "./UI/Modal";

// Makale yazarken kullanıcının "Notlarım"da biriktirdiği AI özetlerini
// taslağa eklemesini sağlar — WriteArticle.jsx'teki SourceSuggestions'daki
// ekle/kaldır toggle deseniyle tutarlı, ama "eklendi mi" durumu ayrı bir
// state'te tutulmuyor: doğrudan taslağın o notun bloğunu içerip
// içermediğine bakılıyor (isNoteAdded) — kullanıcı metni elle silerse buton
// da otomatik "Ekle"ye geri döner, state ile içerik birbirinden kopmaz.
export default function NotePicker({ isNoteAdded, onToggleNote, onClose }) {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyNotes(1)
      .then((data) => setNotes(data.notes))
      .catch(() => setError("Notlar getirilemedi, tekrar deneyin."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Modal title="Notlarımdan Ekle" onClose={onClose}>
      {isLoading ? (
        <p className="text-sm text-white/70">Yükleniyor...</p>
      ) : error ? (
        <p className="text-sm text-accent-coral">{error}</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-white/70">Henüz "Notlarım"da bir not yok.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => {
            const added = isNoteAdded(note);
            return (
              <div key={note._id} className="rounded-2xl bg-white/10 p-3">
                <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-accent-gold/15 px-2 py-0.5 text-[10px] font-semibold text-accent-gold">
                  <Sparkles size={10} />
                  AI özeti
                </span>
                <div className="flex items-start gap-2">
                  {note.sourceType === "pdf" ? (
                    <FileText size={14} className="mt-0.5 flex-none text-white/70" />
                  ) : (
                    <ImageIcon size={14} className="mt-0.5 flex-none text-white/70" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{note.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-white/60">{note.summary}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleNote(note)}
                  className={`mt-2 flex items-center gap-1 self-end rounded-full px-3 py-1.5 text-xs font-semibold ${
                    added ? "bg-teal-500 text-white" : "bg-accent-gold text-brand-900 hover:brightness-95"
                  }`}
                >
                  {added ? <Check size={12} /> : <Plus size={12} />}
                  {added ? "Eklendi" : "Taslağa Ekle"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
