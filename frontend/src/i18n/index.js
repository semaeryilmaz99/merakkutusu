import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Her dil/namespace dosyasını otomatik yüklüyor — yeni bir sayfa çevrildiğinde
// sadece locales/<dil>/<namespace>.json dosyasını eklemek yeterli, bu dosyaya
// (önceden her yeni namespace'te tek tek import/resources/ns eklemek
// gerekiyordu, dosya namespace sayısı arttıkça tekrar tekrar düzenlenen bir
// yüke dönüşmüştü) artık hiç dokunmaya gerek yok.
const modules = import.meta.glob("./locales/*/*.json", { eager: true });

const resources = {};
for (const path in modules) {
  const match = path.match(/\.\/locales\/([a-z]{2})\/([a-zA-Z]+)\.json$/);
  if (!match) continue;
  const [, lang, ns] = match;
  resources[lang] ??= {};
  resources[lang][ns] = modules[path].default;
}

const namespaces = [...new Set(Object.values(resources).flatMap((langResources) => Object.keys(langResources)))];

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
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
