// @uiw/react-md-editor'ın gerçek <textarea>'sı kendi içinde KAYDIRILMIYOR
// (overflow: hidden, tam içerik yüksekliğinde) — asıl kaydırma dıştaki
// .w-md-editor-area elemanında oluyor. Bu yüzden Enter'a basıp imleç görünür
// alanın altına/üstüne çıktığında tarayıcının "textarea'yı imlece göre
// kaydır" davranışı hiç devreye girmiyor (kaydırılacak olan textarea değil,
// atasıdır). Burada aynı "ayna div" tekniğiyle imlecin gerçek ekran
// konumunu bulup .w-md-editor-area'yı elle kaydırıyoruz.
const MIRRORED_STYLE_PROPS = [
  "boxSizing",
  "width",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "lineHeight",
  "fontFamily",
  "textAlign",
  "textTransform",
  "textIndent",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
];

export function scrollCaretIntoView(textarea) {
  const scrollContainer = textarea.closest(".w-md-editor-area");
  if (!scrollContainer) return;

  const computed = window.getComputedStyle(textarea);
  const textareaRect = textarea.getBoundingClientRect();

  const mirror = document.createElement("div");
  mirror.style.position = "fixed";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  mirror.style.top = `${textareaRect.top}px`;
  mirror.style.left = `${textareaRect.left}px`;
  mirror.style.width = `${textareaRect.width}px`;
  MIRRORED_STYLE_PROPS.forEach((prop) => {
    mirror.style[prop] = computed[prop];
  });

  const caretIndex = textarea.selectionStart;
  mirror.textContent = textarea.value.slice(0, caretIndex);
  const marker = document.createElement("span");
  marker.textContent = textarea.value.slice(caretIndex) || ".";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const markerRect = marker.getBoundingClientRect();
  document.body.removeChild(mirror);

  const containerRect = scrollContainer.getBoundingClientRect();

  if (markerRect.top < containerRect.top) {
    scrollContainer.scrollTop -= containerRect.top - markerRect.top;
  } else if (markerRect.bottom > containerRect.bottom) {
    scrollContainer.scrollTop += markerRect.bottom - containerRect.bottom;
  }
}
