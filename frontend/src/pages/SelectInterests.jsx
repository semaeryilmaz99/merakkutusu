import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import api from "../services/api";
import Button from "../components/UI/Button";

// Yükleme sırasında gerçek etiket düzenini taklit eden, değişen genişlikte
// iskelet haplar — düz "Yükleniyor..." metninden sonra liste gelince sayfa
// (dikey ortalı olduğu için) zıplamasın diye.
const SKELETON_WIDTHS = ["w-24", "w-20", "w-28", "w-16", "w-24", "w-32", "w-20", "w-24", "w-28", "w-16"];

export default function SelectInterests() {
  const navigate = useNavigate();
  const [tags, setTags] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api
      .get("/tags")
      .then(({ data }) => setTags(data))
      .finally(() => setIsLoading(false));
  }, []);

  const toggle = (tagId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(tagId) ? next.delete(tagId) : next.add(tagId);
      return next;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.put("/users/interests", { tagIds: Array.from(selected) });
      navigate("/", { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-500 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-brand-700 p-6 shadow-xl">
        <h1 className="mb-6 text-center text-lg font-semibold text-white">İlgi alanlarını seç</h1>

        {isLoading ? (
          <div className="flex flex-wrap gap-3">
            {SKELETON_WIDTHS.map((width, i) => (
              <div key={i} className={`h-9 ${width} animate-pulse rounded-full bg-white/10`} />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => {
              const isSelected = selected.has(tag._id);
              return (
                <button
                  key={tag._id}
                  type="button"
                  onClick={() => toggle(tag._id)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isSelected ? "bg-accent-gold text-brand-900" : "bg-gray-200 text-brand-900 hover:bg-gray-300"
                  }`}
                >
                  {isSelected && <Check size={14} />}
                  #{tag.name}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
          <p className="text-sm text-white/70">{selected.size} konu seçildi</p>
          <div className="w-fit">
            <Button variant="light" onClick={handleSubmit} disabled={isSubmitting || isLoading} className="px-6">
              {isSubmitting ? "Kaydediliyor..." : "Kişisel Feed'ini Oluştur"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
