import { useState } from "react";
import { Image as ImageIcon, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { updateArticle } from "../services/articleService";
import Input from "./UI/Input";
import Modal from "./UI/Modal";
import TagInput from "./TagInput";

// Artık sadece makale düzenleme için kullanılıyor (ArticleDetail.jsx) —
// oluşturma akışı tamamen /write (WriteArticle.jsx) sayfasına taşındı,
// o yüzden burada "oluştur"a özel dallanma yok.
export default function ArticleFormModal({ onClose, article, onSaved }) {
  const { t } = useTranslation("articleForm");
  const [title, setTitle] = useState(article.title);
  const [subtitle, setSubtitle] = useState(article.subtitle || "");
  const [content, setContent] = useState(article.content);
  const [tags, setTags] = useState((article.tags || []).map((tag) => tag.name || tag));
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(article.image || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError(t("validationError"));
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("subtitle", subtitle.trim());
      formData.append("content", content.trim());
      formData.append("tags", tags.join(","));
      if (imageFile) formData.append("image", imageFile);

      const updated = await updateArticle(article._id, formData);
      onSaved?.(updated);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t("saveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title={t("modalTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          label={t("titleLabel")}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
        />

        <Input
          label={t("subtitleLabel")}
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          maxLength={300}
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("contentPlaceholder")}
          rows={8}
          maxLength={20000}
          required
          className="w-full rounded-xl bg-white p-3 text-sm text-brand-900 outline-none"
        />
        <div className="mt-1 flex items-center justify-between px-2 text-[10px] text-white/60">
          <span>{t("markdownHint")}</span>
          <span className="flex-none">{content.length}/20000</span>
        </div>

        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/20">
          <ImageIcon size={14} />
          {imageFile ? imageFile.name : t("changeImage")}
          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </label>

        {imagePreview && (
          <img src={imagePreview} alt="" className="h-32 w-full rounded-xl object-cover" />
        )}

        <TagInput tags={tags} onChange={setTags} />

        {error && <p className="text-center text-sm text-accent-coral">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          aria-label={t("saveAria")}
          className="ml-auto flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent-gold text-brand-900 hover:brightness-95 disabled:opacity-60"
        >
          <Send size={18} />
        </button>
      </form>
    </Modal>
  );
}
