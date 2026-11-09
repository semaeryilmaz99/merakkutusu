import "@testing-library/jest-dom";
// i18next normalde main.jsx'in import ettiği yan etkiyle başlatılıyor —
// testler main.jsx'i hiç çalıştırmadığı için burada da import edilmesi
// gerekiyor, aksi halde useTranslation() ham anahtarı ("search.placeholder"
// gibi) döndürür, çevrilmiş metni değil. Çeviri dosyaları artık dinamik
// import ile (lazy backend, bkz. i18n/index.js) yüklendiği için hem ilk
// init'in hem dil değişiminin bitmesini (await) beklememiz gerekiyor —
// aksi halde testler namespace'ler hazır olmadan render'a başlayabilir.
import i18n, { i18nReady } from "../i18n";

await i18nReady;

// jsdom'un navigator.language'ı genelde "en-US" — dil algılayıcı bunu
// kullanıp testleri İngilizce'ye çevirirdi, var olan testler Türkçe metin
// aradığı için kırılırdı. Test ortamını uygulamanın varsayılanına sabitliyor.
await i18n.changeLanguage("tr");
