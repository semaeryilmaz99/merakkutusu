import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// NOT eager — glob'un anahtarları (dosya yolları) derleme zamanında zaten
// biliniyor, bu yüzden "hangi dil/namespace çiftleri var" listesini
// çıkarmak için dosyaların İÇERİĞİNİ hiç import etmemize gerek yok. Değerler
// artık birer fonksiyon (() => import(...)) — sadece gerçekten çağrıldığında
// ilgili JSON ağdan/chunk'tan çekiliyor.
const localeLoaders = import.meta.glob("./locales/*/*.json");

const namespaceSet = new Set();
for (const path in localeLoaders) {
  const match = path.match(/\.\/locales\/[a-z]{2}\/([a-zA-Z]+)\.json$/);
  if (match) namespaceSet.add(match[1]);
}
const namespaces = [...namespaceSet];

// i18next'in "backend" arayüzü: read(dil, namespace, callback). Önceden TÜM
// dillerin TÜM namespace'leri (5 dil × ~17 dosya) tek bir eager glob ile
// bundle'a gömülüyordu — kullanıcı sadece bir dil kullansa bile diğer 4'ünü
// de indiriyordu. Artık sadece AKTİF dilin dosyaları, ihtiyaç anında
// dinamik import ile çekiliyor.
const localeBackend = {
  type: "backend",
  init() {},
  read(language, namespace, callback) {
    const loader = localeLoaders[`./locales/${language}/${namespace}.json`];
    if (!loader) return callback(new Error(`Missing locale file: ${language}/${namespace}`), null);
    loader()
      .then((mod) => callback(null, mod.default))
      .catch((err) => callback(err, null));
  },
};

// init()'in döndürdüğü promise'i dışa veriyoruz — main.jsx uygulamayı bu
// çözülmeden render etmiyor, aksi halde ilk açılışta çeviri anahtarları
// ("home.search.placeholder" gibi) bir an için ham haliyle görünebilirdi.
export const i18nReady = i18next
  .use(localeBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "tr",
    supportedLngs: ["tr", "en", "es", "de", "fr"],
    ns: namespaces,
    defaultNS: "common",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "language",
    },
    interpolation: { escapeValue: false },
  });

export default i18next;
