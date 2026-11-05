import { Bold, Italic, Quote, List, Link2, Image as ImageIcon, Code, Heading2, Sparkles } from "lucide-react";

const BUTTONS = [
  { id: "heading", icon: Heading2, label: "Başlık" },
  { id: "bold", icon: Bold, label: "Kalın" },
  { id: "italic", icon: Italic, label: "İtalik" },
  { id: "quote", icon: Quote, label: "Alıntı" },
  { id: "list", icon: List, label: "Madde listesi" },
  { id: "link", icon: Link2, label: "Bağlantı" },
  { id: "image", icon: ImageIcon, label: "Görsel ekle" },
  { id: "code", icon: Code, label: "Kod bloğu" },
];

// Mockup'taki sabit biçimlendirme araç çubuğu — görünümsel sorumluluğu
// burada, metin manipülasyonu mantığı (seçili metni sarmalama/imleç
// konumlandırma) WriteArticle.jsx'teki runToolbarAction'da. "/" komut
// paletiyle aynı altyapıyı (pendingCursorRef) paylaşıyor, onun yerine değil
// yanında duruyor.
export default function FormatToolbar({ onAction, disabled = false }) {
  if (disabled) return null;

  return (
    <div
      role="toolbar"
      aria-label="Biçimlendirme"
      className="sticky top-16 z-20 flex flex-wrap items-center gap-0.5 self-start rounded-[var(--radius-ed-lg)] border border-ed-border bg-ed-surface p-1 shadow-[var(--shadow-ed-soft)]"
    >
      {BUTTONS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          aria-label={label}
          onClick={() => onAction(id)}
          className="ed-ib"
        >
          <Icon size={18} />
        </button>
      ))}
      <span aria-hidden="true" className="mx-1 h-5 w-px bg-ed-border" />
      <button
        type="button"
        aria-label="Atıf ekle"
        onClick={() => onAction("atif")}
        className="flex h-10 items-center gap-1.5 rounded-[var(--radius-ed-md)] px-3 text-[13px] font-semibold text-ed-ai hover:bg-ed-ai-bg"
      >
        <Sparkles size={16} />
        Atıf
      </button>
    </div>
  );
}
