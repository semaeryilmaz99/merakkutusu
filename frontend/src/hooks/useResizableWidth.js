import { useCallback, useEffect, useRef, useState } from "react";

// Bir panelin genişliğini kenarından sürükleyerek ayarlamayı sağlar — Sidebar
// (sağ kenardan) ve RightPanel (sol kenardan) aynı mantığı paylaştığı için tek
// yerde tutuluyor. edge: panelin hangi kenarı sürükleniyor ("left" | "right") —
// "left" sürüklenince fare SOLA gittikçe genişlik artar (panel sağda duruyor),
// "right" sürüklenince fare SAĞA gittikçe genişlik artar (panel solda duruyor).
export default function useResizableWidth({ storageKey, defaultWidth, min, max, edge }) {
  const [width, setWidth] = useState(() => {
    try {
      const stored = Number(localStorage.getItem(storageKey));
      return stored >= min && stored <= max ? stored : defaultWidth;
    } catch {
      return defaultWidth;
    }
  });
  const [isResizing, setIsResizing] = useState(false);
  const dragStateRef = useRef(null);

  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      dragStateRef.current = { startX: e.clientX, startWidth: width };
      setIsResizing(true);
    },
    [width]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const { startX, startWidth } = dragStateRef.current;
      const delta = e.clientX - startX;
      const signedDelta = edge === "left" ? -delta : delta;
      setWidth(Math.min(max, Math.max(min, startWidth + signedDelta)));
    };
    const handleMouseUp = () => setIsResizing(false);

    // Sürükleme sırasında imleç ve metin seçimi tüm sayfada tutarlı kalsın diye
    // (fare handle'ın üzerinden çıksa bile) document'a bağlanıyor.
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, edge, min, max]);

  // Her mousemove'da değil, sürükleme bitince tek seferde kaydediyoruz.
  useEffect(() => {
    if (isResizing) return;
    try {
      localStorage.setItem(storageKey, String(width));
    } catch {
      // localStorage erişilemezse sessizce yoksay
    }
  }, [isResizing, storageKey, width]);

  return { width, isResizing, handleMouseDown };
}
