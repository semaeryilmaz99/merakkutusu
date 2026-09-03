import { useEffect, useState } from "react";

const AUTO_DISMISS_MS = 3000;

export default function LibraryToast() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleLibraryChange = (e) => {
      setMessage(e.detail.isInLibrary ? "Makale kütüphanene eklendi." : "Makale kütüphaneden çıkarıldı.");
    };
    window.addEventListener("library:changed", handleLibraryChange);
    return () => window.removeEventListener("library:changed", handleLibraryChange);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(""), AUTO_DISMISS_MS);
    return () => clearTimeout(timeout);
  }, [message]);

  if (!message) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-teal-900 px-4 py-2 text-xs font-medium text-white shadow-xl">
      {message}
    </div>
  );
}
