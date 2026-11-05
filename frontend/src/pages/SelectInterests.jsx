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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-brand-900">Hangi konular ilgini çekiyor?</h1>
          <p className="mt-2 text-sm text-gray-500">
            Birkaç tanesini seç, sana özel bir akış oluşturalım. İstediğin zaman değiştirebilirsin.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-wrap justify-center gap-3">
            {SKELETON_WIDTHS.map((width, i) => (
              <div key={i} className={`h-9 ${width} animate-pulse rounded-full bg-gray-100`} />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            {tags.map((tag) => {
              const isSelected = selected.has(tag._id);
              return (
                <button
                  key={tag._id}
                  type="button"
                  onClick={() => toggle(tag._id)}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? "border-accent-gold bg-accent-gold text-brand-900"
                      : "border-gray-300 bg-white text-brand-800 hover:border-accent-gold hover:bg-accent-gold/5"
                  }`}
                >
                  {isSelected && <Check size={14} />}
                  #{tag.name}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-4 border-t border-gray-100 pt-5">
          <p className="text-sm text-gray-500">{selected.size} konu seçildi</p>
          <div className="w-fit">
            <Button onClick={handleSubmit} disabled={isSubmitting || isLoading} className="px-6">
              {isSubmitting ? "Kaydediliyor..." : "Kişisel Feed'ini Oluştur"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
