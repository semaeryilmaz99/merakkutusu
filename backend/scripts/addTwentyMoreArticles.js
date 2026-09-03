import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Article from "../models/Article.js";
import Tag from "../models/Tag.js";

// Kullanıcı test/demo verisini büyütmek istedi — 20 yeni, uzun içerikli makale.
// Aynı isimde bir başlık zaten varsa atlar (tekrar çalıştırmak güvenli).
const ARTICLES_BY_USERNAME = {
  semaeryilmaz: [
    {
      tags: ["yazılım"],
      title: "Kod Tekrarını Azaltmanın Pratik Yolları",
      content: `Bir kod tabanında aynı mantığın birkaç yerde tekrar etmesi, başta zararsız görünse de zamanla bakımı zorlaştıran bir yüke dönüşür. Bir kural değiştiğinde onu her kopyada ayrı ayrı güncellemek unutulmaya çok açık bir süreçtir; bu da sessizce tutarsız davranışlara yol açar.

En basit çözüm, tekrar eden mantığı bir fonksiyona veya yardımcı modüle çıkarmaktır. Ancak burada dikkat edilmesi gereken bir denge var: her iki-üç satırlık benzerliği hemen bir soyutlamaya dönüştürmek, gereksiz karmaşıklık ekleyebilir. "Üç kere tekrar ettiyse çıkar" kuralı, çoğu ekip için makul bir eşik olarak işe yarıyor.

Component tabanlı frontend geliştirmede bu sorun biraz farklı bir yüzle karşımıza çıkıyor: aynı görsel yapı farklı sayfalarda benzer ama tam aynı olmayan şekillerde kullanılıyor. Burada doğru yaklaşım, ortak yapıyı bir bileşende toplayıp değişen kısımları prop olarak dışarıdan almak — "configuration over duplication" prensibi.

Kod tekrarını azaltmanın bir başka yolu da code review süreçlerinde bilinçli olarak "bu daha önce yazılmış mıydı?" sorusunu sormaktır. Ekip büyüdükçe insanların birbirinin yazdığı yardımcı fonksiyonlardan haberdar olmaması, aynı tekerleğin defalarca icat edilmesine yol açabiliyor — iyi bir iç dokümantasyon bu noktada gerçekten fark yaratıyor.`
    },
    {
      tags: ["gelişim"],
      title: "Uzaktan Ekiplerde İletişim Kurmanın İncelikleri",
      content: `Uzaktan çalışan bir ekipte iletişim, ofis ortamındaki gibi kendiliğinden gerçekleşmiyor — koridorda rastlaşıp iki kelime etmek, omuz üstünden bir soru sormak gibi doğal anlar yok. Bu da iletişimi kasıtlı olarak tasarlamayı gerektiriyor.

İlk fark edilmesi gereken şey, yazılı iletişimin ses tonundan yoksun olduğu. Kısa ve net yazılmış bir mesaj, karşı tarafta soğuk veya sert bir izlenim bırakabilir; oysa niyet böyle değildir. Bu yüzden uzaktan ekiplerde biraz daha açıklayıcı, bağlam veren bir yazım tarzı benimsemek anlaşmazlıkları azaltıyor.

Senkron (eşzamanlı, toplantı gibi) ve asenkron (mesaj, doküman gibi) iletişimi doğru yerde kullanmak da kritik. Her konuyu toplantıya taşımak zaman israfına yol açarken, karmaşık ve tartışmalı konuları sadece mesajlaşmayla çözmeye çalışmak da yanlış anlaşılmalara zemin hazırlıyor.

Son olarak, uzaktan ekiplerde "görünür olmak" fiziksel değil davranışsal bir şey haline geliyor — ilerlemeni düzenli olarak paylaşmak, takıldığın noktaları erken sinyallemek, güven inşa etmenin en somut yolu.`
    },
    {
      tags: ["yazılım", "teknoloji"],
      title: "Teknik Borç Nedir, Nasıl Yönetilir",
      content: `"Teknik borç" terimi, hızlı ilerlemek için bugün alınan kısayolların, gelecekte ekstra bir bakım maliyeti olarak geri gelmesini anlatıyor. Finansal borç gibi düşünülebilir: bugün küçük bir "faiz" ödeyerek hız kazanırsın, ama zamanla o faiz birikip ana borcu aşabilir.

Her teknik borç kötü değildir. Bir MVP'yi (minimum uygulanabilir ürün) hızlıca piyasaya sürmek için bilinçli olarak alınan kısayollar, doğru zamanlama ile makul bir stratejidir — önemli olan bunun "bilinçli" ve "kayıt altında" olması. Sorun, borcun fark edilmeden, plansız şekilde birikmesinde.

Teknik borcu yönetmenin ilk adımı onu görünür kılmaktır: kod içinde TODO/FIXME yorumları, ayrı bir "teknik borç" backlog'u, ya da düzenli refactoring sprint'leri gibi mekanizmalarla. Görünmeyen borç, hiç ödenmeyen borçtur.

İkinci adım, önceliklendirmedir. Her teknik borç eşit acil değildir — sık değişen, hataya açık bir modüldeki borç, nadiren dokunulan bir modüldekinden çok daha önceliklidir. Ekipler genellikle "değişim sıklığı x risk" matrisiyle bu önceliklendirmeyi yapıyor.`
    }
  ],
  semaeryilmaz2: [
    {
      tags: ["tasarım"],
      title: "Kullanıcı Arayüzünde Boşluk Kullanımı",
      content: `Tasarımda "boşluk" (whitespace), genellikle en son düşünülen ama en çok fark yaratan unsurlardan biri. Yeni başlayan tasarımcılar genellikle her boş alanı bir şeyle doldurma eğilimindedir — oysa boşluk, kendi başına bir tasarım aracıdır.

Boşluğun en temel işlevi, gruplama yaratmaktır. Birbiriyle ilişkili öğeler arasında az boşluk, ilişkisiz öğeler arasında fazla boşluk bırakmak, kullanıcının hiçbir açıklama okumadan sayfanın yapısını anlamasını sağlar — buna "yakınlık ilkesi" (proximity) deniyor.

İkinci işlevi ise hiyerarşi kurmaktır. Bir başlığın etrafındaki cömert boşluk, o başlığa otomatik olarak önem katar; sıkışık bir düzen ise her şeyin eşit derecede önemli (ya da önemsiz) hissettirilmesine yol açar.

Son olarak boşluk, okunabilirliği doğrudan etkiler. Satır aralığı (line-height) ve paragraf arası boşluk yetersizse, göz metinde kaybolur; fazlaysa metin birbirinden kopuk hissettirir. İyi bir denge, genellikle font boyutunun 1.4-1.6 katı bir satır yüksekliğiyle yakalanıyor.`
    },
    {
      tags: ["finans"],
      title: "Acil Durum Fonundan Sonra Sırada Ne Var",
      content: `3-6 aylık gideri karşılayan bir acil durum fonu oluşturduktan sonra, birçok kişi "şimdi ne yapmalıyım" sorusuyla karşılaşıyor. Bu noktada net bir öncelik sırası olması, parayı dağınık şekilde değerlendirmekten çok daha etkili sonuçlar veriyor.

İlk öncelik, yüksek faizli borçları kapatmak olmalı. Özellikle kredi kartı borcu gibi faiz oranı yatırım getirisinin çok üzerinde olan borçlar varsa, bu borcu erken kapatmak, neredeyse hiçbir yatırımın sağlayamayacağı "garantili getiri" anlamına gelir.

Borç yoksa veya düşük faizliyse, sıradaki adım genellikle emeklilik/uzun vadeli yatırım hesaplarını değerlendirmektir. Burada zaman ufku uzun olduğu için, kısa vadeli piyasa dalgalanmaları daha az önem taşır ve bileşik getirinin etkisi belirginleşir.

Son olarak, orta vadeli hedefler (ev peşinatı, eğitim gibi) için ayrı bir birikim planı kurmak faydalı olur — bu hedeflerin zaman ufku, hem acil durum fonundan hem emeklilik yatırımından farklı olduğu için farklı bir risk/likidite dengesi gerektirir.`
    }
  ],
  elifyilmaz: [
    {
      tags: ["tasarım"],
      title: "Web Erişilebilirliğinde Renk Kontrastı",
      content: `Renk kontrastı, erişilebilir tasarımın en somut ve en kolay ölçülebilir yönlerinden biri. WCAG (Web Content Accessibility Guidelines) standardı, normal metin için en az 4.5:1, büyük metin için en az 3:1'lik bir kontrast oranı öneriyor — bu sadece görme engelli kullanıcılar için değil, güneş ışığında telefonuna bakan herkes için fark yaratıyor.

Kontrast oranını göz kararıyla değerlendirmek yanıltıcı olabilir; bunun yerine otomatik kontrast kontrol araçları (tarayıcı eklentileri, tasarım araçlarının kendi eklentileri) kullanmak, öznel bir "bence okunuyor" yargısından çok daha güvenilir sonuç verir.

Sadece metin-arkaplan kontrastı değil, ikonlar ve interaktif öğelerin (buton kenarlıkları, form alanları) de yeterli kontrasta sahip olması gerekiyor — aksi halde kullanıcı bir butonun tıklanabilir olduğunu fark edemeyebilir.

Renk kontrastını erken aşamada (tasarım sistemi kurulurken) çözmek, sonradan tek tek sayfa düzeltmekten çok daha verimli. Marka renklerinizin kontrast testinden geçtiğinden emin olduğunuz bir palet belirlemek, ileride tekrar tekrar aynı sorunla uğraşmanızı önlüyor.`
    },
    {
      tags: ["teknoloji", "yazılım"],
      title: "React'te Performans Optimizasyonu İçin İlk Adımlar",
      content: `React uygulamalarında performans sorunları genellikle "her şey gereksiz yere yeniden render oluyor" şeklinde özetlenebilir. Optimizasyona başlamadan önce, gerçekten bir sorun olup olmadığını React DevTools'un Profiler sekmesiyle ölçmek önemli — sezgiyle optimize etmek, çoğu zaman yanlış yeri optimize etmekle sonuçlanır.

En sık karşılaşılan sorunlardan biri, her render'da yeniden oluşturulan inline fonksiyonlar ve nesnelerin, React.memo ile sarılmış alt bileşenlerin memoization'ını geçersiz kılmasıdır. useCallback ve useMemo, bu referans eşitliğini korumak için var — ama her yere körü körüne eklemek de gereksiz karmaşıklık yaratır, çünkü bu hook'ların kendisinin de bir maliyeti var.

Liste render'larında key prop'unun doğru (index değil, kalıcı bir ID) kullanılması, React'in hangi öğelerin gerçekten değiştiğini doğru tespit etmesini sağlıyor — yanlış key kullanımı, gereksiz DOM güncellemelerine ve hatta state karışıklığına yol açabiliyor.

Son olarak, büyük listelerde "virtualization" (sadece görünen öğeleri render etme) ve kod bölme (React.lazy + dynamic import) gibi teknikler, ilk yükleme performansını ciddi şekilde iyileştirebiliyor — özellikle uygulama büyüdükçe bu teknikler bir lüks değil, gereklilik haline geliyor.`
    },
    {
      tags: ["tasarım", "yazılım"],
      title: "Component Kütüphanesi Kurarken Dikkat Edilmesi Gerekenler",
      content: `Bir component kütüphanesi kurmak, tek seferlik bir görev değil, sürekli bakım gerektiren bir üründür — çünkü kullanan ekipler değiştikçe ihtiyaçlar da değişir. Bu yüzden en baştan "bu bir ürün, bir proje değil" zihniyetiyle yaklaşmak, ilerideki sürpriz refactor'ları azaltıyor.

İlk kritik karar, esneklik ile tutarlılık arasındaki dengedir. Her bileşene onlarca prop ekleyip her şeyi özelleştirilebilir yapmak, kısa vadede kullanışlı görünse de, uzun vadede tutarsız bir görsel dil yaratma riski taşır. Sınırlı ama iyi düşünülmüş bir varyant seti (variant="primary" gibi), genellikle sınırsız özelleştirmeden daha sürdürülebilir.

İkinci önemli konu dokümantasyon. Bir bileşen ne kadar iyi tasarlanmış olursa olsun, nasıl kullanılacağı açık değilse ekip üyeleri onu yanlış kullanır ya da hiç kullanmaz, kendi versiyonunu yazar. Storybook gibi araçlarla her bileşenin canlı örneklerini göstermek, bu sürtünmeyi büyük ölçüde azaltıyor.

Son olarak, breaking change yönetimi. Component kütüphanesi büyüdükçe, bir bileşeni değiştirmek onu kullanan onlarca yeri etkileyebilir — bu yüzden sürüm numaralandırma (semantic versioning) ve değişiklik günlüğü (changelog) tutmak, "neden birden bire her yer bozuldu" sorularını önlüyor.`
    }
  ],
  canozturk: [
    {
      tags: ["yazılım"],
      title: "API Versiyonlama Stratejileri",
      content: `Bir API'yi ilk yayınladığınızda kusursuz göründüğü ilk gün geçer geçmez, değişiklik yapma ihtiyacı doğar. Ama o API'yi kullanan başka uygulamalar varsa, her değişiklik onları kırma riski taşır — API versiyonlama tam olarak bu riski yönetmek için var.

En yaygın yaklaşımlardan biri URL'de versiyon belirtmek ("/api/v1/...", "/api/v2/..."). Basit ve açık olsa da, her yeni versiyonda kod tabanında paralel yollar tutmak gerekebilir, bu da bakım yükünü artırır.

Bir diğer yaklaşım header tabanlı versiyonlama ("Accept: application/vnd.myapi.v2+json") — URL'yi temiz tutar ama keşfedilebilirliği (bir geliştiricinin tarayıcıdan direkt deneyebilmesi) azaltır.

Hangi yöntem seçilirse seçilsin, asıl kritik olan "breaking change" ile "backward-compatible change" arasındaki farkı netleştirmek. Yeni bir opsiyonel alan eklemek genellikle güvenlidir ve versiyon gerektirmez; bir alanın adını veya davranışını değiştirmek ise neredeyse her zaman yeni bir versiyon gerektirir. Bu ayrımı net kurallara bağlamak, ekibin "bu değişiklik versiyon gerektirir mi" tartışmasını her seferinde yeniden yapmasını önlüyor.`
    },
    {
      tags: ["teknoloji"],
      title: "Veritabanı Migration'larını Güvenli Yönetmek",
      content: `Veritabanı şema değişiklikleri (migration), bir uygulamanın en riskli operasyonlarından biridir — çünkü kod gibi kolayca geri alınamayan, gerçek kullanıcı verisini etkileyen değişikliklerdir. Bu yüzden migration'lara "geri dönüşü olmayan bir işlem" gözüyle yaklaşmak, gereken dikkati sağlıyor.

İlk kural, migration'ları küçük ve tekil tutmak. Tek bir migration'da hem yeni bir sütun eklemek hem eski veriyi dönüştürmek hem de bir index oluşturmak, bir adımda hata olursa hangi kısmın başarısız olduğunu anlamayı zorlaştırır. Küçük, bağımsız adımlar hem test etmesi hem de geri almayı (rollback) tasarlaması daha kolaydır.

İkinci kural, production'a uygulamadan önce migration'ı gerçek veri boyutuna yakın bir ortamda test etmek. Küçük bir geliştirme veritabanında saniyeler süren bir işlem, milyonlarca satırlık bir production tablosunda dakikalar, hatta saatler sürebilir ve bu süre boyunca tablo kilitlenebilir.

Son olarak, "zero-downtime" migration tekniklerini bilmek değerli: örneğin bir sütunu yeniden adlandırmak yerine yeni bir sütun ekleyip, kodu her iki sütunu da okuyacak şekilde güncelleyip, veriyi arka planda taşıyıp, en son eski sütunu kaldırmak — bu, kesinti gerektirmeyen ama daha fazla adım gerektiren bir yaklaşımdır.`
    },
    {
      tags: ["yazılım"],
      title: "Açık Kaynak Projeye İlk Katkını Yapmak",
      content: `Açık kaynak bir projeye ilk katkıyı yapmak, birçok geliştirici için ürkütücü bir eşiktir — "benim kodum yeterince iyi mi", "yanlış bir şey mi yapacağım" gibi endişeler genellikle gerçek zorluktan daha büyük bir engel oluşturuyor.

İlk katkı için mükemmel bir özellik eklemeye çalışmak yerine küçük başlamak en pratik yol: bir dokümantasyon hatasını düzeltmek, eksik bir açıklama eklemek, ya da "good first issue" etiketli bir konuyu çözmek. Çoğu popüler proje, tam olarak bu amaçla yeni katkıcılar için böyle etiketlenmiş konular tutuyor.

Katkı yapmadan önce projenin CONTRIBUTING.md dosyasını okumak, zaman kaybını büyük ölçüde azaltıyor — kod stili, test bekleyişi, pull request süreci gibi konular genellikle burada net şekilde anlatılıyor ve bu kurallara uymamak, iyi bir katkının bile reddedilmesine yol açabiliyor.

Geri bildirim aldığında savunmaya geçmemek de önemli bir beceri. Code review'da gelen eleştiriler kişisel değil, kodun kalitesini artırmaya yönelik; bu bakış açısıyla yaklaşmak, hem katkıyı daha hızlı tamamlamanı hem de süreçten gerçekten bir şeyler öğrenmeni sağlıyor.`
    }
  ],
  zeynepkaya: [
    {
      tags: ["tasarım"],
      title: "Marka Kimliğinde Tipografi Seçimi",
      content: `Bir markanın tipografi seçimi, logodan çok daha sık karşılaşılan ama çoğu zaman yeterince düşünülmeyen bir karardır — kullanıcı logoyu günde birkaç kez görürken, markanın yazı tipini her metin okuduğunda görür.

İlk adım, markanın "sesini" tipografiye çevirmek. Ciddi ve güvenilir bir finans markası ile enerjik bir gençlik markasının aynı fontu kullanması nadiren işe yarar — serif fontlar genellikle gelenek ve güven hissi verirken, geometrik sans-serif fontlar modernlik ve sadelik hissi verir.

İkinci adım, pratiklik. Estetik olarak mükemmel görünen bir font, küçük boyutlarda okunmuyorsa ya da sadece birkaç dilde karakter desteği sunuyorsa, gerçek kullanımda sorun çıkarır. Bir markanın birden fazla dilde/alfabede kullanılması gerekiyorsa, bu erken aşamada test edilmeli.

Üçüncü adım, tutarlı bir tipografi hiyerarşisi kurmak — başlıklar, alt başlıklar, gövde metni ve vurgular için net kurallar. Bu hiyerarşi bir kere belirlenip tasarım sistemine kaydedildiğinde, her yeni tasarım kararında sıfırdan "bu ne kadar büyük olmalı" tartışması yapılmasını önlüyor.`
    },
    {
      tags: ["sanat"],
      title: "Dijital İllüstrasyonda Kompozisyon Kuralları",
      content: `Kompozisyon, bir illüstrasyonun izleyicinin gözünü nereye ve hangi sırayla götüreceğini belirleyen görünmez bir iskelettir. İyi bir konsept bile zayıf bir kompozisyonla anlatıldığında etkisini kaybedebilir.

En bilinen kompozisyon kuralı "üçte bir kuralı" (rule of thirds) — kanvası dokuz eşit parçaya bölüp, önemli öğeleri bu çizgilerin kesişim noktalarına yerleştirmek, tam ortaya yerleştirmekten çok daha dinamik ve doğal bir denge yaratıyor.

Negatif alan (öğelerin olmadığı boş alanlar) da kompozisyonun aktif bir parçasıdır — doğru kullanıldığında ana öğeyi öne çıkarır, yanlış kullanıldığında ise kompozisyonu dengesiz veya eksik hissettirir.

Renk ve kontrast da kompozisyonel bir araçtır: göz doğal olarak en yüksek kontrastlı alana çekilir. Bu yüzden illüstrasyonun "odak noktasını" o alanda en yüksek kontrastı, geri kalanında ise daha yumuşak geçişleri kullanmak, izleyicinin gözünü istediğiniz sırayla yönlendirmenizi sağlıyor.`
    }
  ],
  mertdemir: [
    {
      tags: ["gelişim"],
      title: "Pomodoro Tekniğini Gerçekten Verimli Kullanmak",
      content: `Pomodoro tekniği (25 dakika odaklanma + 5 dakika mola) basit görünse de, birçok kişi bunu uygularken asıl faydayı kaçırıyor: teknik sadece bir zamanlayıcı kurmaktan ibaret değil, molaların da kasıtlı olarak yönetilmesini gerektiriyor.

En sık yapılan hata, mola sırasında telefona bakmak. Sosyal medya gibi dikkat dağıtıcı bir aktivite, beyni "dinlendirmek" yerine yeni bir uyarana odaklanmaya zorluyor — bu da bir sonraki odaklanma bloğuna daha yorgun başlamana yol açıyor. Gerçek bir mola; kalkmak, gerinme, su içmek gibi pasif aktivitelerle çok daha etkili.

İkinci önemli nokta, her pomodoro'ya net bir hedef belirlemek — "25 dakika çalışacağım" değil, "bu 25 dakikada X görevini bitireceğim" demek. Belirsiz bir süre hedefi, dikkati kolayca dağıtırken, somut bir görev hedefi beynin o göreve kilitlenmesini sağlıyor.

Dört pomodoro'dan sonra uzun bir mola (15-30 dakika) vermek de tekniğin genellikle atlanan bir parçası — sürekli kısa molalarla ilerlemek, günün ilerleyen saatlerinde birikmiş bir yorgunluğa yol açabiliyor.`
    },
    {
      tags: ["gelişim", "psikoloji"],
      title: "Erteleme Alışkanlığının Psikolojik Kökenleri",
      content: `Erteleme, çoğu zaman "tembellik" olarak yaftalanır ama psikoloji araştırmaları bunun aslında bir duygu düzenleme sorunu olduğunu gösteriyor — insanlar görevi değil, o görevin uyandırdığı olumsuz duyguyu (kaygı, sıkılma, yetersizlik hissi) erteliyor.

Bu bakış açısı, erteleme ile mücadele stratejilerini de değiştiriyor. "Daha çok disiplinli ol" gibi genel tavsiyeler işe yaramıyor çünkü asıl sorun disiplin eksikliği değil, göreve başlarken hissedilen duygusal rahatsızlığı yönetememek.

Pratik bir strateji, görevi küçültmek: beyin büyük ve belirsiz bir görevi tehdit olarak algılayıp kaçınma tepkisi verirken, "sadece 2 dakika başla" gibi çok küçük bir eşik, bu tehdit algısını büyük ölçüde azaltıyor. Bir kez başlandığında devam etmek, başlamaktan çok daha kolay oluyor.

Kendine karşı şefkat göstermek de araştırmalarla desteklenen bir strateji — erteleme sonrası kendini suçlamak, kaygıyı artırıp gelecekteki ertelemeyi daha olası hale getiriyor; oysa "olmuş bir şey, şimdi ne yapabilirim" yaklaşımı, kişinin daha hızlı toparlanmasını sağlıyor.`
    },
    {
      tags: ["gelişim"],
      title: "Haftalık Planlama Rutinleri Nasıl Kurulur",
      content: `Günlük yapılacaklar listesi çoğu insan için tanıdık bir araç, ama haftalık planlama çok daha az kullanılıyor — oysa haftalık bakış açısı, günlük listenin göremediği önceliklendirme sorunlarını ortaya çıkarıyor.

Etkili bir haftalık planlama, genellikle haftanın başında (pazar akşamı ya da pazartesi sabahı) 15-30 dakikalık sabit bir rutinle başlıyor. Bu rutinde önce geçen haftanın gözden geçirilmesi (ne bitti, ne kaldı), sonra bu haftanın 2-3 gerçek önceliğinin belirlenmesi öneriliyor — hepsini değil, sadece en önemlilerini.

Zaman bloklama (time blocking) tekniği, haftalık planlamayı somutlaştırmanın etkili bir yolu: her önemli göreve takvimde belirli bir zaman dilimi ayırmak, "bir ara yaparım" diye bırakılan görevlerin sürekli ertelenmesini engelliyor.

Planlamanın gerçekçi olması da kritik — haftanın %100'ünü dolu planlamak, beklenmedik durumlara (acil bir toplantı, hastalık, gecikme) hiç yer bırakmıyor ve ilk aksaklıkta tüm planın çökmesine yol açıyor. Deneyimli planlayıcılar genellikle haftanın %70-80'ini planlayıp geri kalanını tampon olarak bırakıyor.`
    }
  ],
  ayseinal: [
    {
      tags: ["psikoloji"],
      title: "Sınır Koymanın Zihin Sağlığına Etkisi",
      content: `"Hayır" diyememek, birçok insanın fark etmeden yıllarca taşıdığı bir yük haline gelebiliyor. Sınır koyamamak kısa vadede çatışmadan kaçınmayı sağlasa da, uzun vadede tükenmişlik, kızgınlık ve kendine yabancılaşma gibi ciddi bedeller doğurabiliyor.

Sağlıklı bir sınır, ilişkiyi bitirmek değil, onu sürdürülebilir kılmaktır. Bir isteği geri çevirmek, karşı tarafa değer vermediğin anlamına gelmez — sadece o an, o talebi karşılayacak kapasiten olmadığını ifade eder. Bu ayrımı netleştirmek, sınır koyarken hissedilen suçluluğu azaltmaya yardımcı oluyor.

Sınır koymanın pratikte zorlaştığı nokta, genellikle net bir "hayır"dan kaçınıp belirsiz cevaplar vermek — "belki", "bakarım" gibi ifadeler hem karşı tarafta hem kendinde belirsizlik yaratıyor. Net ama nazik bir dil ("şu an bunu yapamam ama şunu önerebilirim") her iki taraf için de daha sağlıklı sonuç veriyor.

Sınır koyma becerisi, doğuştan gelen bir özellik değil, pratikle gelişen bir beceridir. Küçük, düşük riskli durumlarda pratik yapmak (örneğin küçük bir ricayı nazikçe geri çevirmek), daha büyük ve zor durumlarda sınır koymayı kolaylaştırıyor.`
    },
    {
      tags: ["psikoloji"],
      title: "Sosyal Kaygıyla Baş Etme Stratejileri",
      content: `Sosyal kaygı, başkaları tarafından yargılanma veya küçük düşürülme korkusuyla karakterize olan, oldukça yaygın bir deneyimdir. Herkesin zaman zaman hissettiği utangaçlıktan farklı olarak, sosyal kaygı günlük işlevselliği (iş, ilişkiler, sosyal katılım) belirgin şekilde etkileyebiliyor.

Sosyal kaygıyı besleyen en yaygın mekanizmalardan biri "kaçınma davranışı" — kaygı yaratan durumdan kaçınmak kısa vadede rahatlama sağlasa da, beyne "bu durum gerçekten tehlikeli" mesajını pekiştirerek uzun vadede kaygıyı artırıyor. Bilişsel davranışçı terapinin temel prensiplerinden biri, kademeli ve kontrollü maruz kalmanın bu döngüyü kırmaya yardımcı olması.

Sosyal durumlar öncesinde ve sonrasında zihinde tekrar tekrar oynanan "felaket senaryoları" da kaygıyı büyüten bir faktör. Bu düşünceleri fark edip "bu gerçekten olacak mı, yoksa en kötü senaryoyu mu kuruyorum" diye sorgulamak, düşüncenin gücünü azaltabiliyor.

Nefes teknikleri ve bedensel farkındalık da anlık kaygıyı yönetmede pratik araçlar sunuyor — kaygı genellikle bedensel belirtilerle (kalp çarpıntısı, terleme) kendini gösteriyor, bu belirtileri kontrollü nefesle yumuşatmak, zihnin de sakinleşmesine yardımcı oluyor.`
    }
  ],
  burakaydin: [
    {
      tags: ["finans"],
      title: "Enflasyona Karşı Portföy Çeşitlendirme",
      content: `Enflasyon, nakit tutmanın gizli bir maliyeti gibi çalışır — banka hesabındaki para nominal olarak aynı kalsa da, satın alma gücü zamanla erir. Bu yüzden uzun vadeli birikimlerde "enflasyonu yenen" bir strateji kurmak, sadece para biriktirmekten daha önemli hale geliyor.

Hisse senetleri, tarihsel olarak enflasyonun üzerinde getiri sağlama eğiliminde olan varlık sınıflarından biri — çünkü şirketler artan maliyetleri fiyatlarına yansıtabiliyor, bu da gelirlerinin (ve dolayısıyla hisse değerlerinin) enflasyonla birlikte artmasına imkan tanıyor.

Gayrimenkul de geleneksel olarak enflasyona karşı bir koruma aracı olarak görülüyor — hem kira gelirleri hem de mülk değerleri genellikle enflasyonla paralel hareket ediyor. Ancak likidite (hızlıca nakde çevirebilme) açısından hisse senetlerinden daha kısıtlı olduğu unutulmamalı.

Çeşitlendirmenin asıl gücü, tek bir varlık sınıfına bağımlı kalmamaktan geliyor — farklı varlık sınıflarının farklı ekonomik koşullarda farklı performans göstermesi, portföyün genel dalgalanmasını azaltıyor. "Tüm yumurtaları aynı sepete koymamak" klişesi, tam olarak bu prensibi anlatıyor.`
    },
    {
      tags: ["finans"],
      title: "Bileşik Faizin Gücünü Anlamak",
      content: `Bileşik faiz, kazanılan faizin de kendisinin faiz kazanmaya başlamasıdır — basit görünen bu mekanizma, zaman geçtikçe şaşırtıcı derecede büyük farklar yaratabiliyor. Einstein'a atfedilen (doğruluğu tartışmalı olsa da) "dünyanın sekizinci harikası" benzetmesi, bu etkinin gücünü abartılı da olsa iyi özetliyor.

Bileşik faizin en kritik değişkeni zamandır — getiri oranından bile daha belirleyici olabiliyor. 20 yaşında düşük bir miktarla başlayıp uzun süre biriktirmek, 40 yaşında çok daha yüksek bir miktarla başlayıp kısa süre biriktirmekten genellikle daha iyi sonuç veriyor, çünkü bileşik büyüme zamanla üstel bir eğri çiziyor.

Bu etkinin tersi de geçerli — yüksek faizli bir borç da aynı bileşik mantıkla büyüyor. Ödenmeyen bir kredi kartı borcu, zamanla aslında ödenmesi gerekenden çok daha büyük bir yük haline gelebiliyor, çünkü ödenmeyen faiz de kendisi faiz üretmeye başlıyor.

Pratik bir çıkarım: düzenli, küçük katkılar bile zamanla büyük bir birikime dönüşebilir. Ayda küçük bir miktarı otomatik olarak bir yatırım hesabına aktarmak, "büyük bir miktar birikince yatırım yaparım" diye beklemekten çok daha etkili bir stratejidir — çünkü zaman, bileşik faizin en değerli girdisidir.`
    }
  ]
};

const run = async () => {
  await connectDB();

  let createdCount = 0;
  const createdArticles = [];

  for (const [username, articles] of Object.entries(ARTICLES_BY_USERNAME)) {
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`Kullanıcı bulunamadı, atlandı: ${username}`);
      continue;
    }

    for (const seedArticle of articles) {
      const existing = await Article.findOne({ title: seedArticle.title });
      if (existing) {
        console.log(`Zaten vardı, atlandı: "${seedArticle.title}"`);
        continue;
      }

      const tagIds = [];
      for (const tagName of seedArticle.tags) {
        let tag = await Tag.findOne({ name: tagName });
        if (!tag) tag = await Tag.create({ name: tagName });
        tagIds.push(tag._id);
      }

      const article = await Article.create({
        title: seedArticle.title,
        content: seedArticle.content,
        author: user._id,
        tags: tagIds,
        views: Math.floor(Math.random() * 500) + 20
      });

      createdArticles.push(article);
      createdCount++;
      console.log(`Oluşturuldu: "${seedArticle.title}" (${username})`);
    }
  }

  // Gerçekçilik için: rastgele favori + bir yorum + rastgele bir kullanıcının kütüphanesine ekleme
  const allUsers = await User.find({ username: { $in: Object.keys(ARTICLES_BY_USERNAME) } });
  const allUserIds = allUsers.map((u) => u._id);

  for (const article of createdArticles) {
    const otherUserIds = allUserIds.filter((id) => id.toString() !== article.author.toString());
    const favoriteCount = Math.floor(Math.random() * otherUserIds.length);
    article.favorites = otherUserIds.slice(0, favoriteCount);

    if (otherUserIds.length > 0) {
      article.comments.push({
        user: otherUserIds[Math.floor(Math.random() * otherUserIds.length)],
        text: "Gerçekten faydalı bir yazı olmuş, teşekkürler!"
      });
    }

    await article.save();

    const randomReader = allUsers[Math.floor(Math.random() * allUsers.length)];
    if (!randomReader.library.includes(article._id)) {
      randomReader.library.push(article._id);
      await randomReader.save();
    }
  }

  console.log(`\n${createdCount} yeni makale oluşturuldu (toplam ${Object.values(ARTICLES_BY_USERNAME).flat().length} tanım).`);

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("Hata:", err);
  process.exit(1);
});
