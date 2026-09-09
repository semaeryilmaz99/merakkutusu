import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../services/api";

// dark=true (varsayılan): ArticleFormModal.jsx içindeki koyu Modal'da
// kullanılıyor. WriteArticle.jsx artık açık bir "kağıt" yüzeyinde
// olduğundan oradan dark={false} geçiliyor.
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
          className={`w-full rounded-full px-4 py-2 text-sm outline-none ${
            dark
              ? "bg-white/10 text-white placeholder-white/50"
              : "border border-gray-300 bg-white text-brand-900 placeholder-gray-400 focus:border-accent-gold"
          }`}
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
