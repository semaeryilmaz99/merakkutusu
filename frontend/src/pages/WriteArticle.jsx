import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Image as ImageIcon, Send, Sparkles } from "lucide-react";
import { createArticle } from "../services/articleService";
import { suggestSources } from "../services/aiService";
import TagInput from "../components/TagInput";
import SourceSuggestions from "../components/SourceSuggestions";

export default function WriteArticle() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [activeTab, setActiveTab] = useState("write"); // mobilde: "write" | "preview"
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
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl bg-brand-800 p-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Başlık"
          maxLength={200}
          required
          className="w-full rounded-full bg-white/10 px-4 py-3 text-lg font-semibold text-white placeholder-white/50 outline-none"
        />

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/20">
            <ImageIcon size={14} />
            {imageFile ? imageFile.name : "Görsel Ekle (opsiyonel)"}
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
          {imagePreview && (
            <img src={imagePreview} alt="" className="h-12 w-20 rounded-lg object-cover" />
          )}

          <button
            type="button"
            onClick={handleSuggestSources}
            disabled={isSuggesting}
            className="flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/20 disabled:opacity-50"
          >
            <Sparkles size={14} />
            {isSuggesting ? "Aranıyor..." : "Kaynak Öner"}
          </button>
        </div>

        <TagInput tags={tags} onChange={setTags} />
      </div>

      {(isSuggesting || suggestError || sourceSuggestions) && (
        <SourceSuggestions
          isLoading={isSuggesting}
          error={suggestError}
          suggestions={sourceSuggestions}
          onToggleCitation={handleToggleCitation}
        />
      )}

      <div className="flex gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("write")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium ${
            activeTab === "write" ? "bg-brand-700 text-white" : "bg-gray-200 text-brand-900"
          }`}
        >
          Yaz
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium ${
            activeTab === "preview" ? "bg-brand-700 text-white" : "bg-gray-200 text-brand-900"
          }`}
        >
          Önizle
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={activeTab === "write" ? "block" : "hidden lg:block"}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Markdown ile yazmaya başla: **kalın**, # başlık, - liste, [link](url), ```kod```..."
            maxLength={20000}
            required
            className="h-[60vh] min-h-[400px] w-full resize-none rounded-2xl bg-brand-800 p-4 text-sm text-white placeholder-white/40 outline-none"
          />
          <p className="mt-1 px-2 text-right text-[10px] text-gray-400">{content.length}/20000</p>
        </div>

        <div className={activeTab === "preview" ? "block" : "hidden lg:block"}>
          <div className="h-[60vh] min-h-[400px] overflow-y-auto rounded-2xl border-2 border-teal-500 bg-white p-4">
            {content.trim() ? (
              <div className="prose prose-sm max-w-none prose-headings:text-brand-900 prose-a:text-brand-700 prose-strong:text-brand-900 prose-code:text-teal-900">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Önizleme burada görünecek...</p>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-center text-sm text-accent-coral">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2 self-end rounded-full bg-accent-gold px-6 py-3 text-sm font-semibold text-brand-900 hover:brightness-95 disabled:opacity-60"
      >
        <Send size={16} />
        {isSubmitting ? "Yayınlanıyor..." : "Makaleyi Yayınla"}
      </button>
    </form>
  );
}
