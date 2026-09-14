import { useEffect, useState } from "react";
import { BookOpen, Check, ExternalLink, Plus, Sparkles } from "lucide-react";

export default function SourceSuggestions({ error, suggestions, onToggleCitation }) {
  const [addedIndices, setAddedIndices] = useState(() => new Set());

  // Yeni bir arama sonucu geldiğinde ("Kaynak Öner" tekrar tıklanınca) önceki
  // "eklendi" durumları da sıfırlansın — indeksler yeni listede farklı şeyleri temsil ediyor.
  useEffect(() => {
    setAddedIndices(new Set());
  }, [suggestions]);

  // Buton hem ekleme hem çıkarma için — zaten eklenmişse tekrar tıklamak
  // taslaktan kaldırır ve butonu eski haline döndürür.
  const handleToggle = (index, citation) => {
    const wasAdded = addedIndices.has(index);
    onToggleCitation(citation, wasAdded);
    setAddedIndices((prev) => {
      const next = new Set(prev);
      if (wasAdded) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (error) {
    return <p className="text-sm text-accent-coral">{error}</p>;
  }

  if (!suggestions) return null;

  if (suggestions.length === 0) {
    return <p className="text-sm text-gray-500">Taslağınla alakalı bir akademik kaynak bulunamadı.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {suggestions.map((s, i) => (
        <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-accent-gold/20 px-2 py-0.5 text-[10px] font-semibold text-brand-800">
            <Sparkles size={10} />
            AI tarafından önerildi
          </span>
          <div className="flex items-start gap-2">
            <BookOpen size={16} className="mt-0.5 flex-none text-brand-700" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-900">
                {s.paperTitle} {s.year ? <span className="font-normal text-gray-400">({s.year})</span> : null}
              </p>
              <p className="mt-1 text-xs text-gray-600">{s.reason}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            {s.url ? (
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
              >
                <ExternalLink size={12} />
                Kaynağa git
              </a>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={() => handleToggle(i, s.suggestedCitation)}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
                addedIndices.has(i)
                  ? "bg-teal-500 text-white hover:brightness-95"
                  : "bg-accent-gold text-brand-900 hover:brightness-95"
              }`}
            >
              {addedIndices.has(i) ? <Check size={12} /> : <Plus size={12} />}
              {addedIndices.has(i) ? "Eklendi" : "Atıf Ekle"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
