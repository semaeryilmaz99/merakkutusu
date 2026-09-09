import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import remarkGfm from "remark-gfm";
import { Image as ImageIcon, Send, Sparkles, StickyNote } from "lucide-react";
import { createArticle } from "../services/articleService";
import { suggestSources } from "../services/aiService";
import TagInput from "../components/TagInput";
import SourceSuggestions from "../components/SourceSuggestions";
import NotePicker from "../components/NotePicker";

export default function WriteArticle() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [sourceSuggestions, setSourceSuggestions] = useState(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState("");

  const handleSuggestSources = async () => {
    if (!title.trim() || !content.trim()) {
      setSuggestError("Önce bir başlık ve biraz içerik yaz.");
      return;
    }
    setIsSuggesting(true);
    setSuggestError("");
    try {
      const { suggestions } = await suggestSources({ title, content, tags });
      setSourceSuggestions(suggestions);
    } catch (err) {
      setSuggestError(err.response?.data?.message || "Kaynaklar getirilemedi, tekrar deneyin.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleToggleCitation = (citation, wasAdded) => {
    const citationBlock = `\n\n> Kaynak: ${citation}`;
    setContent((prev) => (wasAdded ? prev.replace(citationBlock, "") : `${prev.trim()}${citationBlock}`));
  };

  const [isNotePickerOpen, setIsNotePickerOpen] = useState(false);
  const buildNoteBlock = (note) => `\n\n## ${note.title}\n\n${note.summary}`;
  const isNoteAdded = (note) => content.includes(buildNoteBlock(note));
  const handleToggleNote = (note) => {
    const block = buildNoteBlock(note);
    setContent((prev) => (prev.includes(block) ? prev.replace(block, "") : `${prev.trim()}${block}`));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Başlık ve içerik boş olamaz.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("content", content.trim());
      formData.append("tags", tags.join(","));
      if (imageFile) formData.append("image", imageFile);

      const created = await createArticle(formData);
      navigate(`/articles/${created._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Makale kaydedilemedi, tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start">
      {/* Ana sütun: başlık ve editör artık tek, açık "kağıt" yüzeyi — yardımcı
          işlevler (görsel/etiket/kaynak/not) sağdaki rayda, burada sadece
          yazma deneyimiyle ilgili olmayan hiçbir şey yok. */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Başlık"
            maxLength={200}
            required
            className="w-full border-b border-gray-100 px-5 py-4 text-xl font-semibold text-brand-900 placeholder-gray-400 outline-none"
          />

          <div className="merak-md-editor" data-color-mode="light">
            <MDEditor
              value={content}
              onChange={(value) => setContent((value ?? "").slice(0, 20000))}
              height={480}
              visibleDragbar
              previewOptions={{
                remarkPlugins: [remarkGfm],
                className:
                  "prose prose-sm max-w-none p-4 prose-headings:text-brand-900 prose-a:text-brand-700 prose-strong:text-brand-900 prose-code:text-teal-900"
              }}
              textareaProps={{
                placeholder: "Markdown ile yazmaya başla: **kalın**, # başlık, - liste, [link](url), ```kod```...",
                maxLength: 20000,
                required: true
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-400">{content.length}/20000</p>
          <div className="flex items-center gap-3">
            {error && <p className="text-sm text-accent-coral">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 rounded-full bg-accent-gold px-6 py-3 text-sm font-semibold text-brand-900 transition-[filter] hover:brightness-95 disabled:opacity-60"
            >
              <Send size={16} />
              {isSubmitting ? "Yayınlanıyor..." : "Makaleyi Yayınla"}
            </button>
          </div>
        </div>
      </div>

      {/* Sağ yardımcı ray — masaüstünde sabit 312px, mobilde ana sütunun altına düşer. */}
      <div className="flex w-full flex-col gap-4 lg:w-[312px] lg:flex-none">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Görsel</p>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-4 text-center text-xs text-gray-500 transition-colors hover:border-accent-gold hover:bg-accent-gold/5">
            {imagePreview ? (
              <img src={imagePreview} alt="" className="h-20 w-full rounded-lg object-cover" />
            ) : (
              <ImageIcon size={20} className="text-gray-400" />
            )}
            {imageFile ? imageFile.name : "Görsel Ekle (opsiyonel)"}
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Etiketler</p>
          <TagInput tags={tags} onChange={setTags} dark={false} />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={handleSuggestSources}
            disabled={isSuggesting}
            className="flex w-full items-center gap-2 text-xs font-semibold uppercase text-gray-400 disabled:opacity-50"
          >
            <Sparkles size={14} />
            {isSuggesting ? "Aranıyor..." : "Kaynak Öner"}
          </button>

          {isSuggesting && (
            <div className="mt-3 flex flex-col gap-2">
              <div className="h-3 w-4/5 animate-pulse rounded-full bg-gray-100" />
              <div className="h-3 w-3/5 animate-pulse rounded-full bg-gray-100" />
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-gray-100" />
            </div>
          )}

          {(suggestError || sourceSuggestions) && !isSuggesting && (
            <div className="mt-3">
              <SourceSuggestions
                error={suggestError}
                suggestions={sourceSuggestions}
                onToggleCitation={handleToggleCitation}
              />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setIsNotePickerOpen(true)}
            className="flex w-full items-center gap-2 text-xs font-semibold uppercase text-gray-400"
          >
            <StickyNote size={14} />
            Notlarımdan Ekle
          </button>
        </div>
      </div>

      {isNotePickerOpen && (
        <NotePicker
          isNoteAdded={isNoteAdded}
          onToggleNote={handleToggleNote}
          onClose={() => setIsNotePickerOpen(false)}
        />
      )}
    </form>
  );
}
