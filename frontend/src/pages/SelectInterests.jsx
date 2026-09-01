import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Button from "../components/UI/Button";

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
        <div className="mb-6 rounded-full bg-gray-100 px-4 py-2 text-center text-sm font-semibold text-brand-900">
          Select your favorite subjects
        </div>

        {isLoading ? (
          <p className="text-center text-white">Yükleniyor...</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {tags.map((tag) => {
              const isSelected = selected.has(tag._id);
              return (
                <button
                  key={tag._id}
                  type="button"
                  onClick={() => toggle(tag._id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium uppercase tracking-wide transition-colors ${
                    isSelected
                      ? "bg-accent-gold text-brand-900"
                      : "bg-gray-200 text-brand-900 hover:bg-gray-300"
                  }`}
                >
                  #{tag.name}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <Button variant="light" onClick={handleSubmit} disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Kaydediliyor..." : "Create Your Personal Feed"}
          </Button>
        </div>
      </div>
    </div>
  );
}
