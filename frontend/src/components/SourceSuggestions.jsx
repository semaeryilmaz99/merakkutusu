import { useEffect, useState } from "react";
import { BookOpen, Check, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SourceSuggestions({ error, suggestions, onToggleCitation }) {
  const { t } = useTranslation("write");
  const [addedIndices, setAddedIndices] = useState(() => new Set());

  // Yeni bir arama sonucu geldiğinde ("Kaynak Öner" tekrar tıklanınca) önceki
  // "eklendi" durumları da sıfırlansın — indeksler yeni listede farklı şeyleri temsil ediyor.
  useEffect(() => {
    setAddedIndices(new Set());
  }, [suggestions]);

  // Buton hem ekleme hem çıkarma için — zaten eklenmişse tekrar tıklamak
  // taslaktan kaldırır ve butonu eski haline döndürür.
  const handleToggle = (index, citation, url) => {
    const wasAdded = addedIndices.has(index);
    onToggleCitation(citation, url, wasAdded);
    setAddedIndices((prev) => {
      const next = new Set(prev);
      if (wasAdded) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (error) {
    return <p className="text-[13px] text-ed-ai">{error}</p>;
  }

  if (!suggestions) return null;

  if (suggestions.length === 0) {
    return <p className="text-[13px] text-ed-muted">{t("sources.noMatch")}</p>;
  }

  return (
    <div className="flex flex-col">
      {suggestions.map((s, i) => (
        <div key={i} className="border-t border-ed-border py-4 first:border-t-0 first:pt-0">
          <span className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ed-ai">
            <Sparkles size={9} />
            {t("sources.aiSuggested")}
          </span>
          <div className="flex items-start gap-2">
            <BookOpen size={15} className="mt-0.5 flex-none text-ed-muted" />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold leading-[1.4] text-ed-ink">
                {s.paperTitle} {s.year ? <span className="font-normal text-ed-muted">({s.year})</span> : null}
              </p>
              <p className="mt-1 text-[13px] leading-[1.55] text-ed-ink-soft">{s.reason}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            {s.url ? (
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-[13px] font-medium text-ed-navy hover:underline"
              >
                {t("sources.visitSource")}
              </a>
            ) : (
              <span className="flex-1" />
            )}

            <button
              type="button"
              onClick={() => handleToggle(i, s.suggestedCitation, s.url)}
              className={`inline-flex flex-none items-center gap-1 rounded-full px-[11px] py-[5px] text-[13px] transition-colors ${
                addedIndices.has(i)
                  ? "border border-ed-navy text-ed-navy"
                  : "border border-ed-border-strong text-ed-ink hover:border-ed-navy hover:text-ed-navy"
              }`}
            >
              {addedIndices.has(i) && <Check size={12} />}
              {addedIndices.has(i) ? t("sources.added") : t("sources.addCitation")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
