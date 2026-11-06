import { Bold, Italic, Quote, List, Link2, Image as ImageIcon, Code, Heading2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

// labelKey (düz label değil): bu dizi modül seviyesinde tanımlı, useTranslation()
// burada çağrılamaz — gerçek çeviri aşağıdaki bileşende render anında yapılıyor.
const BUTTONS = [
  { id: "heading", icon: Heading2, labelKey: "toolbar.heading" },
  { id: "bold", icon: Bold, labelKey: "toolbar.bold" },
  { id: "italic", icon: Italic, labelKey: "toolbar.italic" },
  { id: "quote", icon: Quote, labelKey: "toolbar.quote" },
  { id: "list", icon: List, labelKey: "toolbar.list" },
  { id: "link", icon: Link2, labelKey: "toolbar.link" },
  { id: "image", icon: ImageIcon, labelKey: "toolbar.image" },
  { id: "code", icon: Code, labelKey: "toolbar.code" },
];

// Mockup'taki sabit biçimlendirme araç çubuğu — görünümsel sorumluluğu
// burada, metin manipülasyonu mantığı (seçili metni sarmalama/imleç
// konumlandırma) WriteArticle.jsx'teki runToolbarAction'da. "/" komut
// paletiyle aynı altyapıyı (pendingCursorRef) paylaşıyor, onun yerine değil
// yanında duruyor.
export default function FormatToolbar({ onAction, disabled = false }) {
  const { t } = useTranslation("write");

  if (disabled) return null;

  return (
    <div
      role="toolbar"
      aria-label={t("toolbar.aria")}
      className="sticky top-16 z-20 flex flex-wrap items-center gap-0.5 self-start rounded-[var(--radius-ed-lg)] border border-ed-border bg-ed-surface p-1 shadow-[var(--shadow-ed-soft)]"
    >
      {BUTTONS.map(({ id, icon: Icon, labelKey }) => (
        <button
          key={id}
          type="button"
          aria-label={t(labelKey)}
          onClick={() => onAction(id)}
          className="ed-ib"
        >
          <Icon size={18} />
        </button>
      ))}
      <span aria-hidden="true" className="mx-1 h-5 w-px bg-ed-border" />
      <button
        type="button"
        aria-label={t("toolbar.citation")}
        onClick={() => onAction("atif")}
        className="flex h-10 items-center gap-1.5 rounded-[var(--radius-ed-md)] px-3 text-[13px] font-semibold text-ed-ai hover:bg-ed-ai-bg"
      >
        <Sparkles size={16} />
        {t("toolbar.citationLabel")}
      </button>
    </div>
  );
}
