import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Image as ImageIcon, Trash2, Upload, ExternalLink } from "lucide-react";
import { createNote, getMyNotes, deleteNote } from "../services/noteService";
import { formatShortDate } from "../utils/formatDate";
import Modal from "../components/UI/Modal";
import ArticleGrid from "../components/UI/ArticleGrid";
import EmptyState from "../components/UI/EmptyState";

function NoteCardSkeleton() {
  return (
    <div className="flex flex-col items-start gap-2 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="h-3 w-16 animate-pulse rounded-full bg-gray-100" />
      <div className="h-4 w-4/5 animate-pulse rounded-full bg-gray-200" />
      <div className="h-3 w-full animate-pulse rounded-full bg-gray-100" />
      <div className="h-3 w-2/3 animate-pulse rounded-full bg-gray-100" />
    </div>
  );
}

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [activeNote, setActiveNote] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const loadNotes = (targetPage = 1) => {
    setIsLoading(true);
    getMyNotes(targetPage)
      .then((data) => {
        setNotes(data.notes);
        setHasMore(targetPage < data.totalPages);
        setPage(targetPage);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadNotes(1);
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setUploadError("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const note = await createNote(formData);
      setNotes((prev) => [note, ...prev]);
      setFile(null);
      e.target.reset();
    } catch (err) {
      setUploadError(err.response?.data?.message || "Not yüklenemedi, tekrar deneyin.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await getMyNotes(nextPage);
      setNotes((prev) => [...prev, ...data.notes]);
      setHasMore(nextPage < data.totalPages);
      setPage(nextPage);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const openNote = (note) => {
    setActiveNote(note);
    setIsConfirmingDelete(false);
  };

  const closeNote = () => {
    setActiveNote(null);
    setIsConfirmingDelete(false);
  };

  const handleDelete = async (id) => {
    setIsDeleting(true);
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      closeNote();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleUpload} className="flex flex-col gap-3 rounded-2xl bg-brand-800 p-4">
        <p className="text-sm font-semibold text-white">Ders Notu Yükle</p>
        <p className="text-xs text-white/70">
          Bir ekran görüntüsü/fotoğraf ya da PDF yükle, AI senin için özetleyip kütüphanene kaydetsin.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/20">
            <Upload size={14} />
            {file ? file.name : "Dosya Seç (görsel veya PDF)"}
            <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="hidden" />
          </label>
          <button
            type="submit"
            disabled={!file || isUploading}
            className="rounded-full bg-accent-gold px-4 py-2 text-xs font-semibold text-brand-900 hover:brightness-95 disabled:opacity-50"
          >
            {isUploading ? "Özetleniyor..." : "Yükle ve Özetle"}
          </button>
        </div>
        {uploadError && <p className="text-xs text-accent-coral">{uploadError}</p>}
      </form>

      {isLoading ? (
        <ArticleGrid>
          {Array.from({ length: 6 }).map((_, i) => (
            <NoteCardSkeleton key={i} />
          ))}
        </ArticleGrid>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={Upload}
          title="Henüz not yüklemedin."
          description="Yukarıdan bir ekran görüntüsü ya da PDF yükleyerek başla."
        />
      ) : (
        <>
          <ArticleGrid>
            {notes.map((note) => (
              <button
                key={note._id}
                type="button"
                onClick={() => openNote(note)}
                className="flex flex-col items-start gap-2 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center gap-2 text-brand-700">
                  {note.sourceType === "pdf" ? <FileText size={14} /> : <ImageIcon size={14} />}
                  <span className="text-[10px] text-gray-400">
                    {formatShortDate(note.createdAt)}
                  </span>
                </div>
                <p className="text-sm font-semibold text-brand-900">{note.title}</p>
                <p className="line-clamp-3 text-xs text-gray-500">{note.summary}</p>
              </button>
            ))}
          </ArticleGrid>

          {hasMore && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="rounded-full bg-brand-700 px-6 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50"
              >
                {isLoadingMore ? "Yükleniyor..." : "Daha Fazla Yükle"}
              </button>
            </div>
          )}
        </>
      )}

      {activeNote && (
        <Modal title={activeNote.title} onClose={closeNote}>
          <div className="flex flex-col gap-4">
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeNote.summary}</ReactMarkdown>
            </div>

            <a
              href={activeNote.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-fit items-center gap-1 text-xs font-medium text-accent-gold hover:underline"
            >
              <ExternalLink size={12} />
              Orijinal dosyayı aç
            </a>

            {isConfirmingDelete ? (
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-white/70">Bu notu silmek istediğine emin misin?</span>
                <button
                  type="button"
                  onClick={() => handleDelete(activeNote._id)}
                  disabled={isDeleting}
                  className="rounded-full bg-accent-coral px-3 py-1.5 text-xs font-semibold text-white hover:brightness-95 disabled:opacity-50"
                >
                  {isDeleting ? "Siliniyor..." : "Evet, sil"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
                >
                  Vazgeç
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="flex w-fit items-center gap-1 self-end rounded-full bg-accent-coral px-3 py-1.5 text-xs font-semibold text-white hover:brightness-95"
              >
                <Trash2 size={12} />
                Notu Sil
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
