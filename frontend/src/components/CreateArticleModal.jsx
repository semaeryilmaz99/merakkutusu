import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Image as ImageIcon, Send, X } from "lucide-react";
import { createArticle } from "../services/articleService";
import Input from "./UI/Input";
import Modal from "./UI/Modal";

export default function CreateArticleModal({ onClose }) {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const addTag = () => {
    const next = tagInput.trim();
    if (!next || tags.includes(next)) {
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, next]);
    setTagInput("");
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleRemoveTag = (tag) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("content", content.trim());
      if (tags.length > 0) formData.append("tags", tags.join(","));
      if (imageFile) formData.append("image", imageFile);

      const article = await createArticle(formData);
      onClose();
      navigate(`/articles/${article._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Makale oluşturulamadı, tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Makale Oluştur" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          label="Başlık"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Makale içeriği..."
          rows={8}
          required
          className="w-full rounded-xl bg-white p-3 text-sm text-brand-900 outline-none"
        />

        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/20">
          <ImageIcon size={14} />
          {imageFile ? imageFile.name : "Görsel Ekle (opsiyonel)"}
          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </label>

        {imagePreview && (
          <img src={imagePreview} alt="" className="h-32 w-full rounded-xl object-cover" />
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Tag ekle ve Enter'a bas..."
            className="flex-1 rounded-full bg-white/10 px-4 py-2 text-sm text-white placeholder-white/50 outline-none"
          />
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-2 rounded-full bg-accent-gold px-3 py-1 text-xs font-medium text-brand-900"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  aria-label={`${tag} etiketini kaldır`}
                  className="rounded-full hover:bg-brand-900/10"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {error && <p className="text-center text-sm text-accent-coral">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          aria-label="Makaleyi yayınla"
          className="flex h-10 w-10 items-center justify-center self-end rounded-full bg-accent-gold text-brand-900 hover:brightness-95 disabled:opacity-60"
        >
          <Send size={18} />
        </button>
      </form>
    </Modal>
  );
}
