import { useEffect, useState } from "react";
import { X, Hash } from "lucide-react";
import api from "../services/api";

// dark=true (varsayılan): ArticleFormModal.jsx içindeki koyu Modal'da
// kullanılıyor, davranış/görünüm hiç değişmedi. dark=false: WriteArticle.jsx'in
// Editorial künye satırı — pill'ler önce, ardından yuvarlak bir "etiket ekle"
// input kutusu; Enter VEYA virgül ekler, input boşken Backspace son etiketi siler.
export default function TagInput({ tags, onChange, dark = true }) {
  const [allTags, setAllTags] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    api.get("/tags").then(({ data }) => setAllTags(data));
  }, []);

  const suggestions = input.trim()
    ? allTags
        .filter(
          (t) =>
            t.name.toLowerCase().includes(input.trim().toLowerCase()) && !tags.includes(t.name)
        )
        .slice(0, 6)
    : [];

  const addTag = (name) => {
    const next = name.trim();
    if (!next || tags.includes(next)) {
      setInput("");
      setIsOpen(false);
      return;
    }
    onChange([...tags, next]);
    setInput("");
    setIsOpen(false);
  };

  const removeTag = (name) => onChange(tags.filter((t) => t !== name));

  if (!dark) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 rounded-full border border-ed-border-strong px-3 py-1 text-[13px] text-ed-ink"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`${tag} etiketini kaldır`}
              className="text-ed-muted hover:text-ed-ink"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        <div className="relative">
          <div className="flex h-9 items-center gap-2 rounded-full border border-ed-border bg-ed-surface px-3.5">
            <Hash size={14} className="text-ed-muted" />
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 150)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(input);
                } else if (e.key === "Backspace" && !input && tags.length > 0) {
                  removeTag(tags[tags.length - 1]);
                }
              }}
              placeholder="Etiket ekle"
              className="w-28 border-0 bg-transparent text-[13px] text-ed-ink outline-none placeholder:text-ed-placeholder"
            />
          </div>
          {isOpen && suggestions.length > 0 && (
            <div className="absolute left-0 top-full z-10 mt-1 flex w-max flex-wrap gap-1 rounded-[var(--radius-ed-md)] border border-ed-border bg-ed-surface p-2 shadow-[var(--shadow-ed-soft)]">
              {suggestions.map((tag) => (
                <button
                  key={tag._id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addTag(tag.name)}
                  className="rounded-full border border-ed-border-strong px-3 py-1 text-[13px] text-ed-ink hover:border-ed-navy hover:text-ed-navy"
                >
                  #{tag.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(input);
            }
          }}
          placeholder="Tag ekle ve Enter'a bas..."
          className="w-full rounded-full bg-white/10 px-4 py-2 text-sm text-white placeholder-white/50 outline-none"
        />
        {isOpen && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 flex flex-wrap gap-1 rounded-xl bg-white p-2 shadow-lg">
            {suggestions.map((tag) => (
              <button
                key={tag._id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(tag.name)}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-brand-800 hover:bg-gray-200"
              >
                #{tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-2 rounded-full bg-accent-gold px-3 py-1 text-xs font-medium text-brand-900"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`${tag} etiketini kaldır`}
                className="rounded-full hover:bg-brand-900/10"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
