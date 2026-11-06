import { useEffect, useRef, useState } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "tr", label: "Türkçe" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
];

// Navbar.jsx'te (avatarın yanında, her breakpoint'te görünür) ve Login.jsx/
// Register.jsx'te (kapat butonunun yanında, Navbar kullanmayan bağımsız
// sayfalar olduğu için) kullanılıyor. `dark` prop'u koyu (brand-900) zeminler
// için, aksi halde açık zeminlere uyan tetikleyici buton varyantı render
// eder — açılır panel her durumda beyaz (uygulamanın diğer dropdown'larıyla
// — ör. Home.jsx'teki tag filtresi — aynı dil).
export default function LanguageSwitcher({ dark = false }) {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage || i18n.language;
  const currentLang = LANGUAGES.find((l) => l.code === current) || LANGUAGES[0];

  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
          dark
            ? "bg-white/10 text-white hover:bg-white/20"
            : "border border-gray-300 bg-white text-brand-700 hover:bg-gray-50"
        }`}
      >
        <Globe size={14} />
        {currentLang.code.toUpperCase()}
        <ChevronDown size={12} className={`transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <div
        role="listbox"
        className={`absolute right-0 z-20 mt-2 w-40 origin-top-right rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg transition-all duration-150 ${
          isOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        {LANGUAGES.map(({ code, label }) => {
          const isActive = current === code;
          return (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={isActive}
              onClick={() => handleSelect(code)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                isActive ? "bg-accent-gold/15 font-semibold text-brand-900" : "text-brand-800 hover:bg-gray-100"
              }`}
            >
              {label}
              {isActive && <Check size={14} className="text-brand-700" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
