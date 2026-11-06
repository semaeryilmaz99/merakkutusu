import "@testing-library/jest-dom";
// i18next normalde main.jsx'in import ettiği yan etkiyle başlatılıyor —
// testler main.jsx'i hiç çalıştırmadığı için burada da import edilmesi
// gerekiyor, aksi halde useTranslation() ham anahtarı ("search.placeholder"
// gibi) döndürür, çevrilmiş metni değil.
import i18n from "../i18n";

// jsdom'un navigator.language'ı genelde "en-US" — dil algılayıcı bunu
// kullanıp testleri İngilizce'ye çevirirdi, var olan testler Türkçe metin
// aradığı için kırılırdı. Test ortamını uygulamanın varsayılanına sabitliyor.
i18n.changeLanguage("tr");
