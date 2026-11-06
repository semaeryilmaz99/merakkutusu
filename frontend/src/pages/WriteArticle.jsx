import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import remarkGfm from "remark-gfm";
import { ChevronRight, Code, FileText, Heading2, Image as ImageIcon, List, Quote, Sparkles, Table2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18next from "../i18n";
import { useAuth } from "../context/AuthContext";
import { useOnboarding } from "../context/OnboardingContext";
import { useWriteHeader } from "../context/WriteHeaderContext";
import { createArticle } from "../services/articleService";
import { suggestSources } from "../services/aiService";
import { scrollCaretIntoView } from "../utils/scrollCaretIntoView";
import TagInput from "../components/TagInput";
import SourceSuggestions from "../components/SourceSuggestions";
import NotePicker from "../components/NotePicker";
import WriteOnboardingHint from "../components/WriteOnboardingHint";
import FormatToolbar from "../components/FormatToolbar";

// Kullanıcıya özel anahtar — eskiden tek (paylaşılan) bir anahtar kullanılıyordu,
// bu yüzden bir kullanıcının taslağı aynı tarayıcıda oturum açan BAŞKA bir
// kullanıcıya da görünüyordu. Artık her kullanıcının taslağı kendi id'sine
// göre ayrı saklanıyor.
const draftKey = (userId) => `writeArticleDraft_${userId}`;
// Eski, kullanıcıya özel olmayan anahtar — artık okunmuyor, sadece orada
// unutulmuş veri kalmasın diye bir kerelik temizleniyor (bkz. aşağıdaki effect).
const LEGACY_DRAFT_STORAGE_KEY = "writeArticleDraft";

function loadDraft(userId) {
  if (!userId) return null;
  try {
    return JSON.parse(localStorage.getItem(draftKey(userId))) || null;
  } catch {
    return null;
  }
}

// "/" komut menüsü — statik metadata burada, gerçek eylemler (özellikle
// AI olanlar bileşenin kendi state'ine eriştiği için) runSlashCommand'da.
// title/description yerine titleKey/descriptionKey taşıyor — bu dizi modül
// seviyesinde (bileşenin DIŞINDA) tanımlı, useTranslation() burada
// çağrılamaz. Gerçek çeviri, render anında (JSX'te t(cmd.titleKey) ile) ve
// filtrelemede (aşağıda i18next.t() ile, aynı sebepten) yapılıyor. keywords
// bilinçli olarak SADECE Türkçe bırakıldı — zaten başlık/açıklama metni
// üzerinden arama her dilde çalışıyor, eş anlamlıları her dile ayrıca
// çevirmek orantısız bir ek iş olurdu.
const SLASH_COMMANDS = [
  { id: "suggest-sources", icon: Sparkles, ai: true, titleKey: "slash.suggestSources.title", descriptionKey: "slash.suggestSources.description", keywords: ["kaynak", "atif", "ai"] },
  { id: "notes", icon: FileText, ai: true, titleKey: "slash.notes.title", descriptionKey: "slash.notes.description", keywords: ["not", "pdf", "ai"] },
  { id: "heading", icon: Heading2, titleKey: "slash.heading.title", descriptionKey: "slash.heading.description", keywords: ["baslik", "heading", "h2"] },
  { id: "quote", icon: Quote, titleKey: "slash.quote.title", descriptionKey: "slash.quote.description", keywords: ["alinti", "quote"] },
  { id: "list", icon: List, titleKey: "slash.list.title", descriptionKey: "slash.list.description", keywords: ["liste", "list"] },
  { id: "code", icon: Code, titleKey: "slash.code.title", descriptionKey: "slash.code.description", keywords: ["kod", "code"] },
  { id: "image", icon: ImageIcon, titleKey: "slash.image.title", descriptionKey: "slash.image.description", keywords: ["gorsel", "image", "resim"] },
  { id: "table", icon: Table2, titleKey: "slash.table.title", descriptionKey: "slash.table.description", keywords: ["tablo", "table"] }
];

function filterSlashCommands(query) {
  const lang = i18next.language;
  const q = query.trim().toLocaleLowerCase(lang);
  if (!q) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter(
    (cmd) =>
      i18next.t(cmd.titleKey, { ns: "write" }).toLocaleLowerCase(lang).includes(q) ||
      cmd.keywords.some((k) => k.includes(q))
  );
}

export default function WriteArticle() {
  const { t } = useTranslation("write");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startWriteTour } = useOnboarding();
  const { setActions } = useWriteHeader();

  // Sayfa ilk kez açıldığında (ve daha önce görülmediyse) bu sayfaya özel
  // onboarding turunu başlatır — ana kabuk turuyla aynı mekanizma, ayrı bayrak.
  useEffect(() => {
    startWriteTour();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Eski, kullanıcıya özel olmayan taslak anahtarından kalan veriyi bir
  // kerelik temizler — artık hiçbir yerde okunmuyor, orada unutulmasın.
  useEffect(() => {
    localStorage.removeItem(LEGACY_DRAFT_STORAGE_KEY);
  }, []);

  // Backend'de "taslak" kavramı yok (sadece doğrudan yayınlama var) — bu yüzden
  // otomatik kaydetme sunucuya değil, sadece bu tarayıcının localStorage'ına.
  // Sayfa kapanıp yeniden açılırsa (aynı tarayıcıda) taslak geri geliyor;
  // yayınlanınca ya da elle temizlenince siliniyor.
  const initialDraft = loadDraft(user?._id);

  const [title, setTitle] = useState(initialDraft?.title || "");
  const [subtitle, setSubtitle] = useState(initialDraft?.subtitle || "");
  const [content, setContent] = useState(initialDraft?.content || "");
  const [tags, setTags] = useState(initialDraft?.tags || []);
  const [lastSavedAt, setLastSavedAt] = useState(initialDraft?.savedAt || null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState("edit"); // "edit" | "preview"

  // Sağ ray üç hâlden birinde: ipucu (varsayılan), kaynaklar, notlar.
  const [railState, setRailState] = useState("tip"); // "tip" | "sources" | "notes"

  const [sourceSuggestions, setSourceSuggestions] = useState(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState("");

  const handleSuggestSources = async () => {
    if (!title.trim() || !content.trim()) {
      setSuggestError(t("errors.needTitleAndContent"));
      return;
    }
    setIsSuggesting(true);
    setSuggestError("");
    try {
      const { suggestions } = await suggestSources({ title, content, tags });
      setSourceSuggestions(suggestions);
    } catch (err) {
      setSuggestError(err.response?.data?.message || t("errors.sourcesFetchFailed"));
    } finally {
      setIsSuggesting(false);
    }
  };

  const openSources = () => {
    setRailState("sources");
    handleSuggestSources();
  };
  const openNotes = () => setRailState("notes");
  const closeRail = () => setRailState("tip");

  const handleToggleCitation = (citation, wasAdded) => {
    const citationBlock = `\n\n> Kaynak: ${citation}`;
    setContent((prev) => (wasAdded ? prev.replace(citationBlock, "") : `${prev.trim()}${citationBlock}`));
  };

  const buildNoteBlock = (note) => `\n\n## ${note.title}\n\n${note.summary}`;
  const isNoteAdded = (note) => content.includes(buildNoteBlock(note));
  const handleToggleNote = (note) => {
    const block = buildNoteBlock(note);
    setContent((prev) => (prev.includes(block) ? prev.replace(block, "") : `${prev.trim()}${block}`));
  };

  // Başlık: uzun başlıklar iki satıra sarabilsin diye <textarea rows={1}>,
  // içerik değiştikçe yüksekliği JS ile kendine göre ayarlanıyor.
  const titleRef = useRef(null);
  useEffect(() => {
    const el = titleRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [title]);

  // "/" komut menüsü — Notion tarzı filtreleme, ama konumu dokümanın istediği
  // gibi editör gövdesinin sol-altına sabit (imleç takibi yok, daha basit).
  const textareaRef = useRef(null);
  const pendingCursorRef = useRef(null);
  const justDismissedSlashRef = useRef(null);
  const [slashMenu, setSlashMenu] = useState(null); // { slashIndex, query, activeIndex }
  const slashItems = slashMenu ? filterSlashCommands(slashMenu.query) : [];
  const activeSlashItemRef = useRef(null);
  const slashMenuRef = useRef(null);

  // ↑/↓ ile seçim değiştiğinde, seçili satır listenin görünür alanının
  // dışına çıkmışsa menünün kendi scrollbar'ı seçiliye doğru kayar.
  useEffect(() => {
    activeSlashItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [slashMenu?.activeIndex]);

  // Menü açıkken ekranda başka bir yere (menünün ve editörün dışına)
  // tıklanırsa kapanır.
  useEffect(() => {
    if (!slashMenu) return;
    const handleOutsideClick = (e) => {
      if (slashMenuRef.current?.contains(e.target) || textareaRef.current?.contains(e.target)) return;
      setSlashMenu(null);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(slashMenu)]);

  // Bir komut çalıştırıldığında/taslak değiştiğinde imleci doğru yere geri koyar
  // — controlled textarea'da value değişince tarayıcı imleci sıfırlıyor.
  useEffect(() => {
    if (pendingCursorRef.current == null) return;
    const el = textareaRef.current;
    if (el) {
      const pos = pendingCursorRef.current;
      if (typeof pos === "number") {
        el.selectionStart = el.selectionEnd = pos;
      } else {
        el.selectionStart = pos.start;
        el.selectionEnd = pos.end;
      }
      el.focus();
    }
    pendingCursorRef.current = null;
  }, [content]);

  const closeSlashMenu = () => setSlashMenu(null);

  const handleTextareaKeyUp = (e) => {
    // MDEditor'ın gerçek textarea'sı kendi içinde kaydırılmıyor (asıl kaydırma
    // dıştaki .w-md-editor-area'da) — bu yüzden bu, "/" menüsünden önce her
    // tuşta çalışması gereken, erken dönüşlerden ETKİLENMEMESİ gereken bir
    // düzeltme.
    scrollCaretIntoView(e.target);

    // Escape'in kendi keyup'ı, kapattığımız menüyü aynı "/" hâlâ yerinde
    // olduğu için anında yeniden açmasın diye bir kerelik atlanıyor.
    if (justDismissedSlashRef.current !== null) {
      justDismissedSlashRef.current = null;
      return;
    }
    if (["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(e.key)) return;

    const el = e.target;
    const cursorPos = el.selectionStart;
    const value = el.value;
    const textBeforeCursor = value.slice(0, cursorPos);
    const slashIndex = textBeforeCursor.lastIndexOf("/");

    if (slashIndex === -1) {
      closeSlashMenu();
      return;
    }
    const query = textBeforeCursor.slice(slashIndex + 1);
    const charBeforeSlash = slashIndex === 0 ? "\n" : textBeforeCursor[slashIndex - 1];
    const isValidTrigger =
      (charBeforeSlash === "\n" || charBeforeSlash === " ") && !/\s/.test(query) && query.length <= 24;

    if (!isValidTrigger) {
      closeSlashMenu();
      return;
    }
    setSlashMenu({ slashIndex, query, activeIndex: 0 });
  };

  const handleTextareaKeyDown = (e) => {
    if (!slashMenu) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSlashMenu((m) => m && { ...m, activeIndex: (m.activeIndex + 1) % Math.max(slashItems.length, 1) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSlashMenu(
        (m) => m && { ...m, activeIndex: (m.activeIndex - 1 + slashItems.length) % Math.max(slashItems.length, 1) }
      );
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (slashItems.length === 0) return;
      e.preventDefault();
      runSlashCommand(slashItems[slashMenu.activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      justDismissedSlashRef.current = slashMenu.slashIndex;
      closeSlashMenu();
    }
  };

  const runSlashCommand = (cmd) => {
    if (!slashMenu) return;
    const { slashIndex, query } = slashMenu;
    const cursorPos = slashIndex + 1 + query.length;
    const before = content.slice(0, slashIndex);
    const after = content.slice(cursorPos);

    let deferredAction = null;
    let newContent = before + after;
    let cursorAfter = before.length;

    switch (cmd.id) {
      case "suggest-sources":
        deferredAction = () => {
          setRailState("sources");
          handleSuggestSources();
        };
        break;
      case "notes":
        deferredAction = () => setRailState("notes");
        break;
      case "heading":
        newContent = `${before}## ${after}`;
        cursorAfter = before.length + 3;
        break;
      case "quote":
        newContent = `${before}> ${after}`;
        cursorAfter = before.length + 2;
        break;
      case "list":
        newContent = `${before}- ${after}`;
        cursorAfter = before.length + 2;
        break;
      case "code":
        newContent = `${before}\`\`\`\n\n\`\`\`${after}`;
        cursorAfter = before.length + 4;
        break;
      case "image": {
        const desc = t("snippets.imagePlaceholder");
        const snippet = `![${desc}](${t("snippets.imageUrlPlaceholder")})`;
        newContent = before + snippet + after;
        cursorAfter = { start: before.length + 2, end: before.length + 2 + desc.length };
        break;
      }
      case "table": {
        const snippet = `| ${t("snippets.tableHeader1")} | ${t("snippets.tableHeader2")} |\n| --- | --- |\n|  |  |`;
        newContent = before + snippet + after;
        cursorAfter = before.length + snippet.length;
        break;
      }
      default:
        break;
    }

    pendingCursorRef.current = cursorAfter;
    setContent(newContent);
    closeSlashMenu();
    if (deferredAction) {
      // setContent async olduğu için "/kaynak" metni ekrandan kalksın diye
      // önce state güncellensin, eylem bir sonraki tick'te tetiklensin.
      setTimeout(deferredAction, 0);
    }
  };

  // Sabit araç çubuğu (FormatToolbar.jsx) — "/" komut paletiyle AYNI
  // pendingCursorRef altyapısını kullanır, ama imleç konumuna değil seçili
  // metne (veya o an imlecin bulunduğu satırın başına) göre çalışır.
  const insertAtLineStart = (prefix) => {
    const el = textareaRef.current;
    if (!el) return;
    const cursorPos = el.selectionStart;
    const lineStart = content.lastIndexOf("\n", cursorPos - 1) + 1;
    if (content.slice(lineStart, lineStart + prefix.length) === prefix) return; // zaten var
    const newContent = content.slice(0, lineStart) + prefix + content.slice(lineStart);
    pendingCursorRef.current = cursorPos + prefix.length;
    setContent(newContent);
  };

  const wrapSelection = (before, after, placeholder) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end);
    if (selected) {
      const newContent = content.slice(0, start) + before + selected + after + content.slice(end);
      pendingCursorRef.current = { start: start + before.length, end: start + before.length + selected.length };
      setContent(newContent);
    } else {
      const snippet = before + placeholder + after;
      const newContent = content.slice(0, start) + snippet + content.slice(start);
      pendingCursorRef.current = { start: start + before.length, end: start + before.length + placeholder.length };
      setContent(newContent);
    }
  };

  const runToolbarAction = (id) => {
    switch (id) {
      case "heading":
        insertAtLineStart("## ");
        break;
      case "quote":
        insertAtLineStart("> ");
        break;
      case "list":
        insertAtLineStart("- ");
        break;
      case "bold":
        wrapSelection("**", "**", t("snippets.boldPlaceholder"));
        break;
      case "italic":
        wrapSelection("*", "*", t("snippets.italicPlaceholder"));
        break;
      case "link":
        wrapSelection("[", "](url)", t("snippets.linkPlaceholder"));
        break;
      case "image": {
        const el = textareaRef.current;
        if (!el) return;
        const pos = el.selectionStart;
        const desc = t("snippets.imagePlaceholder");
        const snippet = `![${desc}](${t("snippets.imageUrlPlaceholder")})`;
        pendingCursorRef.current = { start: pos + 2, end: pos + 2 + desc.length };
        setContent(content.slice(0, pos) + snippet + content.slice(pos));
        break;
      }
      case "code": {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        if (start !== end) {
          wrapSelection("`", "`", "");
        } else {
          const snippet = "```\n\n```";
          pendingCursorRef.current = start + 4;
          setContent(content.slice(0, start) + snippet + content.slice(start));
        }
        break;
      }
      case "atif":
        openSources();
        break;
      default:
        break;
    }
  };

  // Yazarken 800ms durakladığında taslağı localStorage'a kaydeder — her
  // tuşta yazmamak için Home.jsx'teki arama debounce'uyla aynı desen.
  useEffect(() => {
    if (!user?._id) return;
    if (!title.trim() && !content.trim() && tags.length === 0) return;
    const timeout = setTimeout(() => {
      const savedAt = new Date().toISOString();
      localStorage.setItem(draftKey(user._id), JSON.stringify({ title, subtitle, content, tags, savedAt }));
      setLastSavedAt(savedAt);
    }, 800);
    return () => clearTimeout(timeout);
  }, [title, subtitle, content, tags, user?._id]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const togglePreview = () => {
    closeSlashMenu();
    setPreviewMode((m) => (m === "preview" ? "edit" : "preview"));
  };

  const publishArticle = async () => {
    if (!title.trim() || !content.trim()) {
      setError(t("errors.emptyFields"));
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("subtitle", subtitle.trim());
      formData.append("content", content.trim());
      formData.append("tags", tags.join(","));
      if (imageFile) formData.append("image", imageFile);

      const created = await createArticle(formData);
      if (user?._id) localStorage.removeItem(draftKey(user._id));
      navigate(`/articles/${created._id}`);
    } catch (err) {
      setError(err.response?.data?.message || t("errors.publishFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // WriteNavHeader.jsx (Navbar.jsx'in /write'taki karşılığı), Layout.jsx
  // tarafından <Outlet/>'in YANINDA, ayrı bir dalda render ediliyor — bu
  // yüzden Önizle/Yayınla/otomatik-kaydetme durumunu ona prop ile değil,
  // WriteHeaderContext üzerinden aktarıyoruz. "Null'a dönme" ayrı, TEK
  // seferlik bir effect'te (unmount'ta) — her tuş vuruşunda null'a dönüp
  // hemen yeniden dolmasın (header'da an'lık flicker olmasın) diye.
  useEffect(() => {
    setActions({ previewMode, onTogglePreview: togglePreview, isSubmitting, onSubmit: publishArticle, lastSavedAt });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewMode, isSubmitting, lastSavedAt, title, subtitle, content, tags, imageFile]);

  useEffect(() => {
    return () => setActions(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  // 200 kelime/dk — yayınlanan makaledeki okuma süresi hesabıyla aynı
  // (bkz. backend/utils/toArticleSummary.js), yazarken canlı önizleme için.
  const readTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        publishArticle();
      }}
      className="write-article-page mx-auto flex max-w-[1180px] flex-col items-start gap-10 pb-20 font-ed-sans text-ed-ink lg:h-full lg:flex-row lg:items-stretch lg:gap-[52px] lg:pb-0"
    >
      <div className="min-w-0 flex-1 lg:h-full lg:max-w-[700px] lg:overflow-y-auto lg:overflow-x-hidden lg:pb-10 lg:pr-1">
        <div className="mb-[18px] flex flex-wrap items-center gap-x-[10px] gap-y-1">
          <span className="ed-kicker">{t("draft.kicker")}</span>
          <span className="text-[13px] text-ed-muted">{t("draft.notPublished")}</span>
        </div>

        {previewMode === "preview" ? (
          // Önizlemede başlık/alt başlık/etiketler de YAYINLANMIŞ makaledeki
          // gibi salt-okunur gösteriliyor — sadece gövde metninin değil,
          // sayfanın tamamının gerçek görünümü önizlensin diye.
          <div className="flex flex-col gap-3">
            <h1 className="font-ed-serif text-[clamp(28px,4.2vw,40px)] font-medium leading-[1.15] tracking-[-0.02em] text-ed-ink">
              {title || t("draft.untitled")}
            </h1>
            {subtitle && (
              <p className="font-ed-serif text-lg italic leading-[1.4] text-ed-ink-soft">{subtitle}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3 border-y border-ed-border py-4">
              <span className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full bg-ed-info-bg text-sm font-bold text-ed-navy">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  user?.username?.[0]?.toUpperCase()
                )}
              </span>
              {user?.username && <span className="text-sm font-semibold text-ed-ink">{user.username}</span>}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-ed-border-strong px-3 py-1 text-[13px] text-ed-ink"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <textarea
              ref={titleRef}
              rows={1}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
              placeholder={t("draft.titlePlaceholder")}
              maxLength={200}
              required
              className="w-full resize-none overflow-hidden border-0 bg-transparent p-0 font-ed-serif text-[clamp(28px,4.2vw,40px)] font-medium leading-[1.15] tracking-[-0.02em] text-ed-ink outline-none placeholder:text-ed-placeholder"
            />

            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder={t("draft.subtitlePlaceholder")}
              maxLength={300}
              className="mt-3 w-full border-0 bg-transparent p-0 font-ed-serif text-lg italic leading-[1.4] text-ed-ink-soft outline-none placeholder:text-ed-placeholder"
            />

            {/* Künye satırı: yazar avatarı, kullanıcı adı ve etiketler. */}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-ed-border py-4">
              <span className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full bg-ed-info-bg text-sm font-bold text-ed-navy">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  user?.username?.[0]?.toUpperCase()
                )}
              </span>
              {user?.username && <span className="text-sm font-semibold text-ed-ink">{user.username}</span>}
              <span className="flex-1" />
              <WriteOnboardingHint stepId="write-tags">
                <TagInput tags={tags} onChange={setTags} dark={false} />
              </WriteOnboardingHint>
            </div>
          </>
        )}

        <div className="mt-6">
          <FormatToolbar onAction={runToolbarAction} disabled={previewMode === "preview"} />
        </div>

        <WriteOnboardingHint stepId="write-editor">
        <div
          className="merak-md-editor relative mt-3 w-full"
          data-color-mode="light"
          // Önizlemedeyken metnin herhangi bir yerine tıklamak düzenlemeye
          // geri döner — düzenleme modunda bu hiçbir şey yapmıyor, normal
          // yazma tıklamalarına karışmıyor.
          onClick={() => {
            if (previewMode === "preview") setPreviewMode("edit");
          }}
        >
          {previewMode === "preview" && !content.trim() ? (
            <p className="flex h-[480px] items-center rounded-[var(--radius-ed-lg)] border border-ed-border bg-ed-surface px-5 text-base italic text-ed-muted shadow-[var(--shadow-ed-soft)]">
              {t("draft.emptyPreview")}
            </p>
          ) : (
            <MDEditor
              value={content}
              onChange={(value) => setContent((value ?? "").slice(0, 20000))}
              height={480}
              visibleDragbar={false}
              hideToolbar
              preview={previewMode}
              previewOptions={{
                remarkPlugins: [remarkGfm],
                className:
                  "prose max-w-none prose-headings:font-ed-serif prose-headings:text-ed-ink prose-h2:text-[26px] prose-h2:mt-[26px] prose-h2:mb-[10px] prose-h3:text-[20px] prose-h3:mt-[22px] prose-h3:mb-2 prose-p:text-[18px] prose-p:leading-[1.75] prose-a:text-ed-navy prose-strong:text-ed-ink prose-blockquote:border-0 prose-blockquote:pl-5 prose-blockquote:italic prose-blockquote:text-ed-ink-soft prose-pre:bg-ed-info-bg prose-pre:text-sm prose-pre:p-[15px] prose-code:text-ed-ink"
              }}
              textareaProps={{
                placeholder: t("draft.editorPlaceholder"),
                maxLength: 20000,
                required: true,
                ref: textareaRef,
                onKeyUp: handleTextareaKeyUp,
                onKeyDown: handleTextareaKeyDown
              }}
            />
          )}

          {slashMenu && previewMode === "edit" && (
            <div
              ref={slashMenuRef}
              className="ed-palette-in absolute -bottom-2 left-0 z-20 w-[380px] max-w-[calc(100vw-2rem)] border border-ed-border bg-ed-surface"
              style={{ borderRadius: "var(--radius-ed-md)", boxShadow: "var(--shadow-ed-soft)" }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <p className="px-[14px] pb-2 pt-[11px] text-[10px] font-semibold uppercase tracking-[0.12em] text-ed-muted">
                {t("slash.commandsLabel")}
              </p>
              {slashItems.length === 0 ? (
                <p className="border-t border-ed-border px-[14px] py-2 text-[13px] text-ed-ink-soft">{t("slash.noMatch")}</p>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {slashItems.map((cmd, i) => {
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        ref={i === slashMenu.activeIndex ? activeSlashItemRef : undefined}
                        type="button"
                        onClick={() => runSlashCommand(cmd)}
                        className={`grid w-full grid-cols-[22px_1fr] items-start gap-[10px] border-t border-ed-border px-[14px] py-[10px] text-left transition-colors ${
                          i === slashMenu.activeIndex ? "bg-ed-info-bg" : "hover:bg-ed-info-bg"
                        }`}
                      >
                        <Icon size={17} className="mt-0.5 text-ed-ink-soft" />
                        <span>
                          <span className="flex items-center gap-[7px] text-sm font-semibold text-ed-ink">
                            {t(cmd.titleKey)}
                            {cmd.ai && <span className="ed-ai-badge">AI</span>}
                          </span>
                          <span className="mt-0.5 block text-xs text-ed-muted">{t(cmd.descriptionKey)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        </WriteOnboardingHint>

        {/* Alt ipucu çubuğu — komut kısayolları + hata mesajı (varsa). */}
        <div className="mt-7 flex flex-wrap items-center gap-5 border-t border-ed-border pt-4 text-[13px] text-ed-muted">
          <span className="inline-flex items-center gap-2">
            <kbd className="ed-kbd">/</kbd> {t("draft.slashHint")}
          </span>
          <span className="inline-flex items-center gap-2">
            <kbd className="ed-kbd">Tab</kbd> {t("draft.tabHint")}
          </span>
          {error && <p className="text-ed-ai">{error}</p>}
        </div>
      </div>

      {/* Sağ ray */}
      <aside className="flex w-full flex-col gap-5 lg:h-full lg:w-[360px] lg:flex-none lg:overflow-y-auto lg:pb-10 lg:pl-1">
        <section className="ed-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-ed-muted">
              {railState === "tip" ? t("rail.tip") : railState === "sources" ? t("rail.sources") : t("rail.notes")}
            </h2>
            {railState === "tip" ? (
              <span className="ed-ai-badge">AI</span>
            ) : (
              <button
                type="button"
                onClick={closeRail}
                className="text-[13px] text-ed-muted underline underline-offset-[3px] hover:text-ed-ink"
              >
                {t("rail.close")}
              </button>
            )}
          </div>

          {railState === "tip" && (
            <div className="flex flex-col gap-0.5">
              <WriteOnboardingHint stepId="write-sources">
                <button type="button" onClick={openSources} className="ed-row-btn">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 flex-none items-center justify-center rounded-[var(--radius-ed-md)] bg-ed-ai-bg text-ed-ai"
                  >
                    <Sparkles size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-ed-ink">{t("rail.sourcesActionTitle")}</span>
                    <span className="mt-0.5 block text-[13px] leading-[1.4] text-ed-muted">
                      {t("rail.sourcesActionDescription")}
                    </span>
                  </span>
                  <ChevronRight size={16} className="mt-2.5 flex-none text-ed-placeholder" />
                </button>
              </WriteOnboardingHint>

              <WriteOnboardingHint stepId="write-notes">
                <button type="button" onClick={openNotes} className="ed-row-btn">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 flex-none items-center justify-center rounded-[var(--radius-ed-md)] bg-ed-info-bg text-ed-navy"
                  >
                    <FileText size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-ed-ink">{t("rail.notesActionTitle")}</span>
                    <span className="mt-0.5 block text-[13px] leading-[1.4] text-ed-muted">
                      {t("rail.notesActionDescription")}
                    </span>
                  </span>
                  <ChevronRight size={16} className="mt-2.5 flex-none text-ed-placeholder" />
                </button>
              </WriteOnboardingHint>
            </div>
          )}

          {railState === "sources" &&
            (isSuggesting ? (
              <div className="flex flex-col gap-[9px]">
                <span className="h-3 w-4/5 animate-pulse rounded bg-ed-border" />
                <span className="h-3 w-3/5 animate-pulse rounded bg-ed-border" />
                <span className="h-3 w-2/3 animate-pulse rounded bg-ed-border" />
                <p className="mt-1 text-[13px] text-ed-muted">{t("rail.sourcesLoading")}</p>
              </div>
            ) : (
              <SourceSuggestions
                error={suggestError}
                suggestions={sourceSuggestions}
                onToggleCitation={handleToggleCitation}
              />
            ))}

          {railState === "notes" && <NotePicker isNoteAdded={isNoteAdded} onToggleNote={handleToggleNote} />}
        </section>

        <section className="ed-card">
          <div className="mb-3.5 flex items-baseline justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-ed-muted">{t("cover.title")}</h2>
            <span className="text-xs text-ed-muted">{t("cover.optional")}</span>
          </div>
          {imagePreview ? (
            <div>
              <img src={imagePreview} alt="" className="aspect-video w-full rounded-[var(--radius-ed-lg)] object-cover" />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview("");
                }}
                className="mt-2 border-0 bg-transparent p-0 text-[13px] text-ed-muted underline underline-offset-[3px] hover:text-ed-ink"
              >
                {t("cover.remove")}
              </button>
            </div>
          ) : (
            <WriteOnboardingHint stepId="write-cover">
              <label className="ed-drop flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-ed-border bg-ed-surface text-ed-navy"
                >
                  <ImageIcon size={20} />
                </span>
                <span className="text-sm font-semibold text-ed-ink">{t("cover.select")}</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </WriteOnboardingHint>
          )}
          <p className="mt-3 text-[13px] leading-[1.5] text-ed-muted">{t("cover.hint")}</p>
        </section>

        <section className="grid grid-cols-3 gap-2 px-1">
          <div className="flex flex-col gap-1">
            <span className="font-ed-serif text-[26px] leading-none text-ed-ink">{wordCount}</span>
            <span className="text-xs text-ed-muted">{t("stats.words")}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-ed-serif text-[26px] leading-none text-ed-ink">{content.length}</span>
            <span className="text-xs text-ed-muted">{t("stats.chars")}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-ed-serif text-[26px] leading-none text-ed-ink">{content.trim() ? readTime : "—"}</span>
            <span className="text-xs text-ed-muted">{t("stats.readTime")}</span>
          </div>
        </section>
      </aside>
    </form>
  );
}
