import { createContext, useContext, useEffect, useState } from "react";
import { getMyLibrary } from "../services/articleService";
import { useAuth } from "./AuthContext";

const LibraryContext = createContext(null);

export function LibraryProvider({ children }) {
  const { user } = useAuth();
  const [library, setLibrary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Library.jsx (sayfa) ve RightPanel'in LibraryPanel'i aynı anda /library
  // rotasında görünüyor ve ikisi de kütüphane verisine ihtiyaç duyuyordu —
  // her ikisi de bağımsız getMyLibrary() çağırdığından sayfa her açıldığında
  // aynı veri için iki ayrı istek atılıyordu. Artık tek kaynak burası.
  useEffect(() => {
    if (!user) {
      setLibrary([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getMyLibrary()
      .then(setLibrary)
      .finally(() => setIsLoading(false));
  }, [user?._id]);

  // ArticleCard/ArticleDetail kütüphane toggle'ı başarılı olunca bu event'i yayınlıyor
  // (Faz 22'de chat aktivasyonu için eklenmişti) — merkezi state artık burada
  // tek bir dinleyiciyle güncelleniyor.
  useEffect(() => {
    if (!user) return;
    const handleLibraryChange = () => {
      getMyLibrary().then(setLibrary);
    };
    window.addEventListener("library:changed", handleLibraryChange);
    return () => window.removeEventListener("library:changed", handleLibraryChange);
  }, [user?._id]);

  return (
    <LibraryContext.Provider value={{ library, isLoading }}>{children}</LibraryContext.Provider>
  );
}

export const useLibrary = () => useContext(LibraryContext) || { library: [], isLoading: true };
