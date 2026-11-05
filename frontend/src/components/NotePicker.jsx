import { useEffect, useState } from "react";
import { FileText, Image as ImageIcon, Check, Sparkles } from "lucide-react";
import { getMyNotes } from "../services/noteService";

// Makale yazarken kullanıcının "Notlarım"da biriktirdiği AI özetlerini
// taslağa eklemesini sağlar. Artık bir modal değil — sağ raya gömülü, çağıran
// (WriteArticle.jsx) ortak ray başlığını ve "kapat" linkini kendisi sağlıyor.
// "Eklendi mi" durumu ayrı bir state'te tutulmuyor: doğrudan taslağın o notun
// bloğunu içerip içermediğine bakılıyor (isNoteAdded) — kullanıcı metni elle
// silerse buton da otomatik "Ekle"ye geri döner.
export default function NotePicker({ isNoteAdded, onToggleNote }) {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyNotes(1)
      .then((data) => setNotes(data.notes))
      .catch(() => setError("Notlar getirilemedi, tekrar deneyin."))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <p className="text-[13px] text-ed-muted">Yükleniyor…</p>;
  }

  if (error) {
    return <p className="text-[13px] text-ed-ai">{error}</p>;
  }

  if (notes.length === 0) {
    return <p className="text-[13px] text-ed-muted">Henüz "Notlarım"da bir not yok.</p>;
  }

  return (
    <div className="flex flex-col">
      {notes.map((note) => {
        const added = isNoteAdded(note);
        return (
          <div key={note._id} className="border-t border-ed-border py-4 first:border-t-0 first:pt-0">
            <div className="mb-1.5 flex items-center gap-[7px]">
              {note.sourceType === "pdf" ? (
                <FileText size={15} className="text-ed-muted" />
              ) : (
                <ImageIcon size={15} className="text-ed-muted" />
              )}
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ed-ai">
                <Sparkles size={9} />
                AI özeti
              </span>
            </div>
            <p className="text-[15px] font-semibold leading-[1.4] text-ed-ink">{note.title}</p>
            <p className="mt-1 line-clamp-2 text-[13px] leading-[1.55] text-ed-ink-soft">{note.summary}</p>
            <button
              type="button"
              onClick={() => onToggleNote(note)}
              className={`mt-2 inline-flex items-center gap-1 rounded-full px-[11px] py-[5px] text-[13px] transition-colors ${
                added
                  ? "border border-ed-navy text-ed-navy"
                  : "border border-ed-border-strong text-ed-ink hover:border-ed-navy hover:text-ed-navy"
              }`}
            >
              {added && <Check size={12} />}
              {added ? "Eklendi ✓" : "Taslağa ekle"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
