import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Article from "../models/Article.js";
import Tag from "../models/Tag.js";
import ChatRoom from "../models/ChatRoom.js";
import ChatMessage from "../models/ChatMessage.js";
import Notification from "../models/Notification.js";

// Mevcut tüm makaleleri siler (ve bunlara bağlı sarkan referansları temizler),
// yerine 30 yeni, uzun ve gerçekçi makale ekler — her biri farklı bir test
// kullanıcısından, 7 farklı konu başlığı altında. uploadSeedImages.js'in
// ürettiği gerçek Cloudinary URL'lerini kullanır.
const imageUrls = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "scripts", "seedImageUrls.json"), "utf-8")
);

const TAG_NAMES = [
  "teknoloji", "tasarım", "sanat", "yazılım", "gelişim", "psikoloji", "finans",
  "ai", "sağlık", "aşk", "hayat", "bilim"
];

// Yeni gönderilen görseller tema bazlı — yazılım/sağlığın kendine özel görseli
// olmadığı için en yakın temaya (ai / bilim) sahip görseller tekrar kullanılıyor.
const img = (file) => imageUrls[file];

const ARTICLE_SEEDS = [
  {
    author: "elifyilmaz", tags: ["ai", "yazılım"],
    title: "Kod Editöründe Yapay Zeka: Gerçekten Daha Hızlı mı Yazıyoruz?",
    image: img("37.jpg"),
    content: `Son bir yıldır editörümde bir AI asistanı sürekli açık. Önce "yazdığım her satırı tahmin eden bir araç" gibi geliyordu, şimdi daha çok "yanımda oturan, bazen çok işe yarayan, bazen tamamen yanlış bir stajyer" gibi hissettiriyor. Basit bir CRUD endpoint'i, bir form validasyonu, tekrar eden bir test iskeleti — bunlarda gerçekten saatler kazandırıyor. Ama mimari bir karar vermem gerektiğinde, ya da bir bug'ın kök nedenini anlamam gerektiğinde, hâlâ kendi başıma düşünmek zorunda kalıyorum.

Ekibimle birlikte üç ay boyunca "AI destekli" ve "AI'sız" yazılan PR'ları karşılaştırdık. Satır başına geçen süre gerçekten düşmüştü, ama code review'da geçen süre neredeyse aynı kalmıştı — çünkü üretilen kod bazen gereğinden karmaşık, bazen de proje konvansiyonlarına aykırı oluyordu. Yani "daha hızlı yazmak" ile "daha hızlı teslim etmek" aynı şey değilmiş.

Bugün vardığım nokta şu: AI'ı bir otomasyon aracı değil, bir taslak oluşturucu gibi kullanıyorum. İlk taslağı o yazıyor, ben onu projenin geri kalanına uydurup sadeleştiriyorum. Bu, "hiç yazmamaktan" çok "boş sayfa sorununu çözmekten" bahsediyor aslında — ki bu da az bir şey değil. Yine de şunu unutmamak gerekiyor: üretilen her satırın sorumluluğu hâlâ bizde, AI bir imza atmıyor, sadece öneri sunuyor.`
  },
  {
    author: "elifyilmaz", tags: ["yazılım", "tasarım"],
    title: "Component Tabanlı Düşünmek: React'ten Öğrendiklerim",
    image: img("38.jpg"),
    content: `React'e ilk başladığımda en çok zorlandığım şey, bir sayfayı "bütün olarak" değil, "parçaların toplamı olarak" görmekti. Tasarımdan gelen bir ekranı önce kafamda küçük kutucuklara bölmem, her kutucuğun kendi state'ine, kendi sorumluluğuna sahip olmasını düşünmem gerekiyordu. Bu alışkanlığı kazanana kadar her component dosyası devasa, her şeyi yapan bir canavar hâline geliyordu.

Zamanla fark ettim ki iyi bir component ayrımı aslında iyi bir tasarım sistemi kurmakla aynı disiplini gerektiriyor. Bir buton bileşeni sadece görünüp kaybolmuyor, aynı zamanda "bu projede buton nasıl davranır" sorusunun cevabını da taşıyor. Bu yüzden artık yeni bir özelliğe başlamadan önce ilk sorduğum soru kod değil, tasarım: "Bu ekranda kaç farklı tekrar eden örüntü var, hangisi zaten var olan bir component'e sığıyor?"

Bunun bir bedeli de var tabii — aşırı parçalamak, her şeyi "yeniden kullanılabilir" yapma hevesiyle gereksiz soyutlamalar üretmek çok kolay. Üç kez tekrar etmeyen bir yapıyı component'e çıkarmak genelde zaman kaybı oluyor, çünkü ilk iki kullanımda hangi parametrelerin gerçekten değişken olduğunu henüz bilmiyorsunuz. Bu yüzden kuralım basit: önce iki kere tekrar et, üçüncüde component'e çıkar.

Bugün geriye dönüp baktığımda, component tabanlı düşünmenin bana en çok kazandırdığı şey kod değil, bir bakış açısı oldu — karmaşık her problemi, birbirine bağlı küçük ve anlaşılır parçalara bölme alışkanlığı. Bu, sadece React'te değil, günlük hayatta karşılaştığım büyük problemlerde de işime yarıyor.`
  },
  {
    author: "elifyilmaz", tags: ["sanat", "tasarım"],
    title: "Arayüz Tasarımı Aslında Bir Sanat Formu mu?",
    image: img("43.jpg"),
    content: `Üniversitede güzel sanatlar okuyan bir arkadaşım bir gün "senin yaptığın şey sanat değil, mühendislik" demişti. O zamanlar ona hak vermiştim — sonuçta bir buton, bir form, bir navigasyon menüsü tuvale resim yapmaktan çok uzak görünüyordu. Ama yıllar geçtikçe bu ayrımın sandığım kadar net olmadığını fark ettim.

Bir arayüz tasarlarken aslında sürekli estetik kararlar veriyorsunuz: bu iki eleman arasında ne kadar boşluk olmalı, bu rengin tonu kullanıcıda hangi hissi uyandırır, bu animasyon ne kadar sürerse "doğal" hissettirir. Bunların hiçbiri saf mühendislik sorusu değil — hepsi, resim ya da heykelde olduğu gibi, kompozisyon ve oran meselesi. Tek fark, bizim tuvalimizin işlevsel bir amacı olması: güzellik tek başına yetmiyor, aynı zamanda kullanılabilir de olması gerekiyor.

İşte tam burada sanat ile tasarım ayrılıyor bence. Bir ressam izleyicisine bir duygu yaşatmak zorunda değil, isterse rahatsız edebilir, isterse anlaşılmaz bırakabilir. Ama bir arayüz tasarımcısının böyle bir lüksü yok — en yaratıcı çözüm bile, kullanıcı o düğmeyi bulamıyorsa başarısızdır. Bu da tasarımı, sanattan çok, kısıtlamalar içinde yaratıcılık gösterme sanatına benzer bir yere koyuyor — belki de mimarlığa daha yakın.

Yine de, iyi bir arayüzün karşısında durduğumda hissettiğim şey bir tabloyla karşılaşmaktan çok farklı değil: bir şeylerin "doğru" olduğunu, her pikselin bir sebeple orada durduğunu hissediyorum. Belki de cevap, ikisinin aynı şey olmadığı ama aynı disiplinden beslendiği.`
  },
  {
    author: "canozturk", tags: ["ai", "teknoloji"],
    title: "Büyük Dil Modelleri Nasıl 'Düşünür'? Basit Bir Anlatım",
    image: img("39.jpg"),
    content: `"Yapay zeka düşünüyor mu?" sorusu, teknik bir soru olmaktan çok felsefi bir tartışmaya dönüşüyor genelde. Ama işin mühendislik tarafına bakarsak, aslında olan biten şaşırtıcı derecede basit bir fikre dayanıyor: bir cümledeki bir sonraki kelimeyi tahmin etmek. Büyük dil modelleri, milyarlarca metin örneğinden "bu kelimeden sonra hangi kelime gelme ihtimali yüksek" sorusunun istatistiksel bir haritasını çıkarıyor.

Elbette bu kadar basit bir açıklama, modelin neden bu kadar "akıllı" göründüğünü tam açıklamıyor. Çünkü bir sonraki kelimeyi doğru tahmin edebilmek için, aslında bağlamı, cümlenin konusunu, hatta bir dereceye kadar mantıksal tutarlılığı da örtük olarak öğrenmek gerekiyor. Yani model kelimeleri değil, kelimelerin arkasındaki örüntüleri öğreniyor — bu örüntüler bazen gerçek bir anlama çok benziyor, bazen de tamamen yanlış yönde emin bir şekilde yanılıyor (buna "halüsinasyon" deniyor).

Bu benzetmeyi anlamak, bu araçları doğru kullanmak için de kritik. Bir dil modeline "bu makalenin kaynağı nedir" diye sorduğunuzda, model gerçekten bir kaynağı hatırlamıyor — en olası görünen kelime dizisini üretiyor, ve bu dizi gerçek bir kaynağa denk gelebilir de gelmeyebilir de. Bu yüzden projelerimizde AI'ı "gerçek bilgi kaynağı" değil, "metin üreten bir araç" olarak kullanıyoruz; gerçek veriyi her zaman ayrı bir kaynaktan (veritabanı, arama API'si) çekip modele "burada sana verdiğim bilgiye göre cevap ver" diyoruz.

Sonuç olarak, bu modellerin büyüsü zekâ değil, ölçek. Yeterince veri ve yeterince parametre, istatistiksel bir tahmin motorunu, konuşma kurabilen bir şeye dönüştürüyor. Bunun felsefi olarak "düşünme" sayılıp sayılmayacağı tartışılır, ama mühendislik olarak ne yaptığını bilmek, bu araçları abartmadan ve küçümsemeden doğru yerde kullanmamızı sağlıyor.`
  },
  {
    author: "canozturk", tags: ["yazılım", "teknoloji"],
    title: "Mikroservislere Geçmeden Önce Sormanız Gereken Sorular",
    image: img("40.jpg"),
    content: `Birkaç yıl önce katıldığım bir projede, henüz 5 kişilik bir ekip ve birkaç bin kullanıcısı olan bir ürünü "ileride ölçeklenebilsin" diye 12 mikroservise böldük. Sonuç: her küçük özellik değişikliği için 4 farklı repoda PR açmak, aralarındaki ağ gecikmelerini debug etmek, ve "hangi servis hangi veriye sahip" sorusuna cevap bulmaya çalışırken geçen sonsuz toplantılar. İki yıl sonra bu servislerin yarısını tekrar birleştirdik.

Bu deneyimden sonra artık mikroservislere geçmeden önce ekiplere üç soru soruyorum. Birincisi: gerçekten farklı ölçeklenme ihtiyaçları olan parçalarınız var mı — yani bir kısım saniyede on bin istek alırken diğer kısım günde yüz istek mi alıyor? İkincisi: birden fazla, birbirinden bağımsız çalışabilen ekibiniz var mı — mikroservisin asıl faydası genelde teknik değil, organizasyoneldir, ekipler birbirini beklemeden deploy edebilsin diyedir. Üçüncüsü: dağıtık sistemlerin getirdiği karmaşıklığı (network hataları, eventual consistency, distributed tracing) yönetecek deneyiminiz ve araçlarınız var mı?

Bu sorulardan birine bile net bir "evet" diyemiyorsanız, muhtemelen monolitik bir mimariyle çok daha hızlı ilerlersiniz — ve iyi yapılandırılmış bir monolit (net modül sınırları, temiz katmanlar), kötü bölünmüş bir mikroservis mimarisinden her zaman daha sürdürülebilir. Mikroservis bir hedef değil, belirli bir ölçekteki belirli bir soruna verilen cevaptır; "büyük şirketler böyle yapıyor" diye kopyalanacak bir trend değil.

Bugün yeni bir projeye başlarken ilk tercihim hâlâ net sınırları olan, modüler bir monolit. Gerçekten bir servisi ayırmam gerektiğinde bunu monolitin içinde net bir modül hâline getirip, ihtiyaç kesinleştiğinde ayırıyorum — bu, baştan on iki parçaya bölüp sonra geri toplamaktan çok daha ucuza geliyor.`
  },
  {
    author: "canozturk", tags: ["bilim", "teknoloji"],
    title: "Algoritma Karmaşıklığı: Neden Önemli, Ne Zaman Önemli Değil",
    image: img("51.jpg"),
    content: `Big-O notasyonu, üniversitede en çok korkulan ama en az günlük hayata uygulanan konulardan biri. Çoğu geliştirici mülakatlarda "bu algoritmanın karmaşıklığı nedir" sorusuyla terleyip, işe başladıktan sonra bir daha hiç bilinçli olarak düşünmüyor bu konuyu. Ama gerçek şu ki, bu kavram anlaşıldığında, günlük kod yazma şeklinizi sessizce ama kalıcı olarak değiştiriyor.

Mesele, bir algoritmanın veri büyüdükçe ne kadar yavaşlayacağını tahmin edebilmek. 100 elemanlı bir listede iç içe iki döngü kullanmak kimsenin fark etmeyeceği kadar hızlı çalışır. Aynı kodu 100 bin elemanlı bir listeye uyguladığınızda, saniyeler değil dakikalar, bazen saatler konuşuyor olabilirsiniz. İşte bu yüzden "çalışıyor" ile "ölçeklenebilir" arasındaki fark, çoğu zaman tam da bu matematiksel sezgiyle ilgili.

Ama burada önemli bir denge var: her satır kodu en optimal algoritmaya göre yazmaya çalışmak, çoğu gerçek dünya senaryosunda zaman kaybı. Eğer bir liste asla 50 elemandan fazla olmayacaksa, O(n²) bir algoritma ile O(n log n) bir algoritma arasındaki fark, kullanıcının fark edemeyeceği milisaniyeler cinsindendir — ama okunabilirlik ve bakım kolaylığı açısından fark büyük olabilir. Erken optimizasyon, yazılım mühendisliğinde hâlâ "tüm kötülüklerin kökü" olarak anılıyor, haksız da değil.

Benim kuralım basit: önce doğru ve okunabilir kodu yaz, sonra gerçek veriyle ölç, sadece gerçekten yavaş olan ve gerçekten büyüyecek olan kısımları optimize et. Karmaşıklık analizi bir süs değil, bir sezgi aracı — ne zaman endişelenmeniz, ne zaman rahat olabileceğinizi bilmenizi sağlıyor.`
  },
  {
    author: "canozturk", tags: ["yazılım"],
    title: "Açık Kaynağa İlk Katkınızı Nasıl Yaparsınız",
    image: img("41.jpg"),
    content: `İlk açık kaynak katkımı yapmadan önce yıllarca "ben daha hazır değilim, bu kadar büyük bir projeye nasıl kod gönderirim" diye düşünmüştüm. Bugün geriye dönüp baktığımda, bu korkunun büyük bölümünün gerçekle hiç alakası olmadığını görüyorum — çoğu proje, iyi yazılmış bir dokümantasyon düzeltmesini bile büyük bir minnetle karşılıyor.

İlk katkınız için en iyi yer, kullandığınız ama katkıda bulunmadığınız bir kütüphane. Çünkü o projeyi zaten kullanıcı olarak tanıyorsunuz, hangi kısımların kafa karıştırıcı olduğunu, hangi hata mesajının yetersiz kaldığını biliyorsunuz. "good first issue" etiketli açık görevlere bakmak yerine, kendi karşılaştığınız küçük bir sürtünmeyi düzeltmek genelde daha motive edici oluyor — çünkü bir sorunu "çözmek" istiyorsunuz, bir listeden görev seçmek değil.

Teknik olarak katkı kadar önemli bir konu da iletişim şekli. Büyük açık kaynak projelerde bakımcılar genelde gönüllü ve zamanları kısıtlı — bu yüzden net, küçük, tek bir şeyi yapan PR'lar, devasa ve her şeyi aynı anda değiştiren PR'lardan çok daha hızlı merge ediliyor. Bir özellik eklemeden önce bir issue açıp "bunu yapmayı düşünüyorum, doğru yaklaşım bu mu" diye sormak, sonradan reddedilen büyük bir emeği önlüyor.

Bugün bir projeye yeni başlayan birine tek bir tavsiyem var: mükemmel bir katkı aramayın, gerçek bir katkı yapın. İlk PR'ınız bir typo düzeltmesi bile olsa, o deneyim size "ben de bu ekosistemin bir parçasıyım" hissini veriyor — ve bu his, bir sonraki, biraz daha büyük katkıya giden en kısa yol.`
  },
  {
    author: "canozturk", tags: ["ai", "yazılım"],
    title: "Yapay Zeka Araçlarına Güvenmek ile Kontrol Etmek Arasında",
    image: img("42.jpg"),
    content: `Geçen ay bir junior geliştirici arkadaşım, AI asistanının ürettiği bir SQL sorgusunu hiç sorgulamadan production'a deploy etti. Sorgu "çalışıyordu" — ama WHERE koşulunda küçük bir mantık hatası yüzünden, olması gerekenden çok daha fazla kaydı güncelliyordu. Neyse ki geri alınabilir bir işlemdi, ama bu olay bana şunu hatırlattı: AI'ın ürettiği kod, bir meslektaşınızın yazdığı kod kadar şüpheyle (ve saygıyla) incelenmeli.

Buradaki asıl risk, AI'ın çok akıcı ve emin görünen bir dille yanlış şeyler söyleyebilmesi. İnsan bir meslektaşınız "emin değilim ama sanırım şöyle" derken, bir dil modeli aynı kesinlikte yanlış bir cevabı da, doğru bir cevabı da sunabiliyor — ses tonunda hiçbir fark yok. Bu da bizi, normalde insan kaynaklı kod için göstermediğimiz bir dikkatsizliğe itebiliyor, çünkü "makine söyledi" ifadesi bilinçaltımızda bir otorite hissi yaratıyor.

Ekibimde geliştirdiğimiz basit bir kural var: AI'ın ürettiği hiçbir kod, onu üreten kişi onu tam olarak anlamadan commit edilmez. "Bu neden böyle çalışıyor" sorusuna cevap veremiyorsanız, o kodu yazmamışsınız demektir, sadece kopyalamışsınız. Bu kural yavaşlatıcı gibi görünse de, aslında uzun vadede debug süresini kısaltıyor — çünkü üç ay sonra o kodda bir hata çıktığında, en azından biri onu gerçekten anlıyor.

Sonuç olarak AI, iyi bir ortak ama kötü bir otorite. Önerilerini dinlemek, taslaklarını kullanmak akıllıca; ama son sözü, son sorumluluğu, hâlâ insan geliştiriciye bırakmak gerekiyor. Belki de bu dengeyi en iyi özetleyen cümle şu: AI'a güvenin, ama imzayı siz atın.`
  },
  {
    author: "zeynepkaya", tags: ["sanat"],
    title: "Renklerin Hafızası: Bir İllüstratörün Günlüğünden",
    image: img("44.jpg"),
    content: `Çocukluğumda büyükannemin bahçesindeki gül rengi bir duvar vardı. O rengi tam olarak tarif edemem — ne pembe ne kiremit, ikisinin arasında, güneşte biraz soluk bir ton. Yıllar sonra bir illüstrasyonda o rengi yeniden yakalamaya çalıştığımda fark ettim ki, renk seçimim aslında hiçbir zaman tamamen teknik bir karar olmadı; her zaman bir anının, bir mekânın, bir duygunun izini sürüyordum.

Profesyonel olarak çalışmaya başladığımda bana "renk teorisi" öğretildi — tamamlayıcı renkler, analog paletler, sıcak-soğuk dengesi. Bunlar gerçekten faydalı araçlar, ama bir eseri gerçekten etkileyici yapan şey bu kuralları bilmek değil, ne zaman kırılacağını bilmek. En akılda kalan illüstrasyonlarım, "doğru" renk teorisine uymayan, ama belli bir duyguyu tam isabetle yakalayan paletlerle yapılanlar oldu.

Dijital araçlarla çalışmanın bir tehlikesi de burada ortaya çıkıyor: renk seçici araç, size sonsuz seçenek sunuyor ve bu bolluk bazen kararsızlığa dönüşüyor. Kağıt üzerinde çalışırken elimdeki sınırlı boya paletiyle çalışmak zorundaydım, bu da beni daha cesur seçimler yapmaya itiyordu. Şimdi bilinçli olarak dijital paletimi kısıtlıyorum — bir projeye başlamadan önce sadece 5-6 renk belirliyorum, geri kalanını o sınırlar içinde çözüyorum.

Bugün bir öğrenciye renk hakkında tek bir tavsiye verecek olsam, teoriyi öğrenmelerini ama ona asla tamamen güvenmemelerini söylerim. Renk, matematikten çok hafızayla ilgili bir mesele — ve en güçlü paletler, genelde bir yerden, bir andan, gerçek bir anıdan çalınmış olanlar.`
  },
  {
    author: "zeynepkaya", tags: ["sanat", "yazılım"],
    title: "Dijital Çağda El Çizimi Hâlâ Neden Önemli",
    image: img("45.jpg"),
    content: `Procreate'te bir illüstrasyonu bitirmem artık eskisinden çok daha hızlı — geri alma tuşu, katman yönetimi, sonsuz tuval. Ama son birkaç yıldır bilinçli olarak haftada en az bir gün kağıt ve kalemle çiziyorum, hiçbir dijital araç kullanmadan. Bunu nostalji için değil, çok somut bir sebepten yapıyorum: kağıt, geri alma tuşu olmadığı için sizi daha dikkatli gözlemlemeye zorluyor.

Dijital ortamda bir çizgiyi beğenmediğinizde anında silip tekrar deniyorsunuz — bu, hızlı iterasyon için harika ama "ilk bakışta doğru gözlemi yapma" becerisini köreltebiliyor. Kağıtta her çizgi kalıcı olduğu için, çizmeden önce daha uzun bakıyorsunuz, oranları daha dikkatli ölçüyorsunuz. Bu disiplin, dijital çalışmalarıma da sessizce yansıyor — artık dijitalde de daha az çizip daha çok gözlemliyorum.

Bunun bir de pratik yanı var: büyük bir müşteri sunumunda tabletim bozulduğunda, elimde hâlâ bir kalem ve kağıtla fikir üretebilme becerisi vardı. Araçlara tamamen bağımlı hâle gelmek, yaratıcı sürecinizi kırılgan hâle getiriyor. El çizimi pratiği, bir nevi sigorta — teknoloji ne kadar gelişirse gelişsin, gözünüz ve eliniz arasındaki bağ hâlâ en temel araç.

Öğrencilerime hep aynı şeyi söylüyorum: dijital araçları öğrenin, hızlı ve profesyonel olun, ama elinizi hiç bırakmayın. Çünkü araçlar değişir — on yıl önce Photoshop vazgeçilmezdi, bugün yapay zeka destekli araçlar konuşuluyor. Değişmeyen tek şey, bir şeyi gerçekten görebilme ve onu anlamlandırabilme becerisi.`
  },
  {
    author: "zeynepkaya", tags: ["sanat"],
    title: "Bir Tablonun Karşısında Durmak: Michelangelo'dan Ders",
    image: img("46.jpg"),
    content: `Floransa'ya ilk gittiğimde, Accademia Galerisi'nde David heykelinin karşısında durduğumda beklemediğim bir şey hissettim: ezilmişlik. Yıllarca sanat tarihi kitaplarından, fotoğraflardan tanıdığım bir eserin gerçek ölçeğiyle, gerçek dokusuyla karşılaşmak, ekrandan bakmanın asla veremeyeceği bir şeyi veriyor — mermerin damarlarını, ışığın kıvrımlardaki oyunlarını, heykelin kendi ağırlığını hissettiren duruşunu.

Bu deneyim bana illüstrasyon pratiğim hakkında önemli bir şey öğretti: bir eserin "iyi" olup olmadığını sadece ekranda, küçük bir önizlemede karar vermemeliyim. Bir illüstrasyon telefon ekranında harika görünüp, büyük bir baskıda detaylarını kaybedebiliyor, ya da tam tersi. Şimdi önemli projelerimi bitirmeden önce mutlaka büyük bir ekranda, hatta mümkünse çıktı alıp fiziksel olarak inceliyorum — dijital önizleme, gerçek deneyimin sadece bir gölgesi.

Michelangelo'nun David'i aynı zamanda bana kısıtlamaların yaratıcılığı nasıl beslediğini de hatırlattı. Efsaneye göre o mermer bloğu, başka bir heykeltıraş tarafından kötü yontulmuş, kusurlu bir parçaydı ve kimse onunla bir şey yapamayacağını düşünüyordu. Michelangelo bu "bozuk" malzemeyi reddetmek yerine, onun sınırları içinde çalışarak tarihin en ikonik heykellerinden birini ortaya çıkardı. Bu, bana her "kusurlu" taslağın, her "yetersiz" brief'in aslında bir fırsat olabileceğini hatırlatıyor.

Sanatla ilgilenen herkese bir müze ziyaretini asla ekrandan ikame etmemelerini öneririm. Bir eserin karşısında fiziksel olarak durmak, sadece estetik bir deneyim değil — aynı zamanda ölçek, doku ve zaman hakkında, hiçbir fotoğrafın veremeyeceği bir ders.`
  },
  {
    author: "zeynepkaya", tags: ["hayat", "sanat"],
    title: "Yaratıcı Tıkanıklık Anlarında Kendime Söylediklerim",
    image: img("27.jpg"),
    content: `Geçen sonbahar üç hafta boyunca hiçbir şey çizemedim. Her açtığım boş tuval, bir eleştiri gibi karşımda duruyordu; her fikir, aklımda oluşur oluşmaz yetersiz görünüyordu. Yaratıcı bir işte çalışan herkesin bildiği o tanıdık his: elleriniz çalışıyor ama kafanız boş, ya da tam tersi, kafanız dolu ama eller bir türlü o doluluğu kağıda aktaramıyor.

İlk tepkim her zamanki gibi daha çok çalışmaya zorlamak oldu — daha uzun saatler, daha fazla referans, daha fazla "ilham" aramak. Bu yaklaşım işe yaramadı, aksine tıkanıklığı derinleştirdi. Dönüm noktası, bir terapi seansında (evet, yaratıcı bloklar için terapiye gitmek de bir seçenek) söylediğim bir cümle oldu: "Sanki her çizimin mükemmel olması gerekiyormuş gibi hissediyorum." İşte orada anladım ki sorun beceri değil, beklenti.

O günden sonra kendime küçük bir kural koydum: "kötü" çizim günleri. Haftada bir gün, bilinçli olarak kötü, dağınık, hiçbir yere gitmeyen çizimler yapıyorum — hiçbirini kimseye göstermeden. Bu, mükemmeliyetçiliğin baskısını kaldırıyor ve ellerimin tekrar rahatça hareket etmesine izin veriyor. İronik bir şekilde, en sevdiğim işlerimden bazıları bu "kötü" günlerden, hiçbir beklenti olmadan çıktı.

Bugün bir yaratıcı tıkanıklık anında kendime söylediğim şey şu: "Bu dönem bir boşluk değil, bir hazırlık." Bazen beyin, görünürde hiçbir şey üretmezken arka planda bir şeyleri işliyor. Sabırsızlanmak yerine, o sessizliğe biraz güvenmeyi öğrendim — ve genelde, en beklemediğim anda bir fikir kendiliğinden geliyor.`
  },
  {
    author: "zeynepkaya", tags: ["aşk", "sanat"],
    title: "Bir İlişkiyi Resmetmek Mümkün mü",
    image: img("34.jpg"),
    content: `Bir arkadaşım evlilik yıl dönümü hediyesi olarak, kendisi ve eşinin portresini çizmemi istediğinde, ilk tepkim heyecan oldu. İkinci tepkim ise paniğe yakın bir soru: "Bir ilişkiyi nasıl resmedersiniz?" İki yüz çizebilirsiniz, ama asıl aktarmak istedikleri şey — yirmi yıllık bir ortaklık, binlerce küçük an, paylaşılmış bir sessizlik — tek bir karede nasıl sığdırılır?

Aylarca onların fotoğraflarına baktım ve fark ettim ki en çarpıcı kareler asla poz verdikleri anlar değildi. En güçlü olanlar, birbirlerinin farkında bile olmadıkları, gündelik anlardı — biri kahve demlerken diğerinin ona bakışı, bir kutlamada el ele tutuşmadan sadece omuzların birbirine değmesi. İlişkiyi resmetmenin sırrı, büyük jestlerde değil, bu fark edilmeyen yakınlıklarda saklıymış.

Sonunda çizdiğim portre, ikisinin yüz yüze değil, yan yana, aynı yöne bakarken durduğu bir andı — sanki ikisi de aynı ufka bakıyor, ama birbirlerinin varlığından güç alıyorlardı. Teslim ettiğimde arkadaşım ağladı ve "bu tam da hissettiğimiz şey" dedi. O an anladım ki sanat, bir duyguyu kopyalamıyor, onu bir sembole indirgiyor — ve bazen o sembol, gerçekliğin kendisinden daha dokunaklı oluyor.

O günden beri çift portreleri çizerken hiç poz istemiyorum. Onlara sadece birlikte zaman geçirmelerini, ben de sessizce gözlemlemeyi tercih ediyorum. Çünkü bir ilişkinin gerçeği, kameraya gülümsediğiniz anda değil, kimse bakmıyorken birbirinize nasıl davrandığınızda saklı.`
  },
  {
    author: "zeynepkaya", tags: ["aşk", "psikoloji"],
    title: "Sessiz Sevgi Dilleri: Söze Dökülmeyen Şefkat",
    image: img("35.jpg"),
    content: `Büyükbabam büyükanneme asla "seni seviyorum" demezdi — en azından ben hiç duymadım. Ama her sabah onun için çayı doğru kıvamda demlerdi, soğuk günlerde paltosunu önce ona uzatırdı, hiçbir şey söylemeden. Küçükken bu bana eksik bir sevgi gibi görünürdü; büyüdükçe fark ettim ki bu, kelimelerle ifade edilenden hiç de eksik olmayan, sadece farklı bir dildi.

İllüstratör olarak insan ilişkilerini gözlemlemek işimin önemli bir parçası ve yıllar içinde fark ettiğim bir şey var: en derin sevgi anları nadiren fotoğraf karesine giriyor, çünkü çoğunlukla gürültüsüz. Bir tabağı sessizce doldurmak, birinin yorgun olduğunu fark edip sözsüz bir iş paylaşımı yapmak, birinin sevmediği bir filmi sadece onun yanında olmak için izlemek — bunların hiçbiri "romantik" bir sahne değil, ama belki de sevginin en dürüst hâli bu.

Bu beni, aşkın her zaman büyük jestlerle kanıtlanması gerektiği fikrine karşı biraz temkinli yapıyor. Sosyal medyada gördüğümüz sürpriz tatiller, devasa çiçek buketleri elbette güzel, ama bir ilişkinin uzun vadeli sağlığı genelde bu küçük, görünmez tutarlılıklarda saklı. Biri sizi hatırlıyor mu, küçük tercihlerinizi fark ediyor mu, zor bir günde söz söylemeden yanınızda duruyor mu — bunlar, bence, "seni seviyorum" demekten çok daha zor ve çok daha anlamlı eylemler.

Bugün kendi ilişkimde de bu dersi uygulamaya çalışıyorum: sevgiyi sadece söylemek değil, fark edilmeyen küçük eylemlerle göstermek. Çünkü kelimeler unutulabilir, ama birinin sizi gerçekten gördüğünü hissettiren o sessiz jestler, genelde en uzun süre hatırlananlar oluyor.`
  },
  {
    author: "mertdemir", tags: ["gelişim", "hayat"],
    title: "Sabah Rutinimi Neden Sil Baştan Kurdum",
    image: img("28.jpg"),
    content: `İki yıl boyunca "mükemmel sabah rutini" peşinde koştum: 5'te kalkmak, meditasyon, soğuk duş, günlük tutmak, egzersiz — hepsini bir arada, her gün. İlk iki hafta harika gidiyordu, sonra tükeniyordum ve bir gün kaçırdığımda tüm sistemi terk ediyordum. Bu döngüyü belki on kez yaşadım, her seferinde "bu sefer başaracağım" diyerek.

Sorunun rutinin kendisinde değil, tasarımında olduğunu anladığımda bir şey değişti. Ben, bir günümün en zayıf anındaki enerjime göre değil, en motive olduğum günün hayaline göre bir sistem kuruyordum. Gerçekçi bir rutin, en kötü günümde bile yapabileceğim minimum versiyonu içermeli — hasta bir sabah, uykusuz bir gece sonrasında bile sürdürülebilecek bir şey.

Bugünkü rutinim çok daha mütevazı: uyandığımda telefona bakmadan önce bir bardak su içmek, ve beş dakika pencerenin önünde oturmak. Hepsi bu. Bazı günler buna kitap okumayı, egzersizi ekliyorum, ama bu ikisi "olmazsa olmaz" değil, sadece "varsa güzel". Bu küçültme, beni şaşırtıcı bir şekilde eskisinden çok daha tutarlı yaptı — çünkü artık bir günü kaçırmak, tüm sistemi çökertmiyor.

Kişisel gelişim literatüründe sürekli "daha fazlasını yap" mesajı var, ama benim deneyimim tam tersini söylüyor: sürdürülebilirlik, iddialı hedeflerden değil, gerçekçi minimumlardan geliyor. Bir rutinin gücü, en iyi gününüzde ne kadar ileri gidebildiğinizde değil, en kötü gününüzde bile ayakta kalıp kalmadığında ölçülüyor.`
  },
  {
    author: "mertdemir", tags: ["gelişim", "hayat"],
    title: "Yavaşlamayı Öğrenmek: Verimlilik Takıntımın Sonu",
    image: img("31.jpg"),
    content: `Beş yıl boyunca verimlilik üzerine yazdım, okudum, podcast dinledim. Pomodoro tekniğini, zaman bloklamayı, "derin çalışma"yı, hatta uyku takip uygulamalarını denedim. Her gün dakika dakika planlanmış bir takvimim vardı ve her boş zaman dilimi bana bir suçluluk kaynağı gibi geliyordu — "şu anda neden üretken bir şey yapmıyorum" sorusu kafamda sürekli dönüyordu.

Bu döngü, bir yaz tatilinde kırıldı. Hiçbir plan yapmadan, telefonumu neredeyse hiç açmadan beş gün geçirdim. İlk iki gün gerçekten huzursuzdum — sanki hayatımı "kaçırıyormuşum" gibi hissediyordum. Üçüncü günden itibaren bir şey değişti: düşüncelerim daha net akmaya başladı, aylardır çözemediğim bir iş problemine dair bir fikir, hiç zorlamadan aklıma geldi. O an fark ettim ki beynim, sürekli doluluk içinde değil, boşlukta en iyi çalışıyordu.

Bu deneyimden sonra "verimlilik" kelimesini sorgulamaya başladım. Belki de asıl mesele daha çok iş yapmak değil, doğru işi, doğru zihinsel durumda yapmaktı. Şimdi takvimimde bilinçli olarak "hiçbir şey yapmama" blokları bırakıyorum — ne telefon, ne kitap, sadece oturmak ya da yürümek. Bu, tembellik gibi hissettiriyor ama sonuçları tam tersini gösteriyor: bu boşluklardan sonra geçen çalışma saatleri çok daha odaklı geçiyor.

Bugün insanlara verimlilik tavsiyesi verirken ilk söylediğim şey artık "daha fazla sistem kurma" değil, "bazen hiçbir sistem kurmamayı dene." Çünkü zihnimiz, bir makine gibi sürekli çalışmak için değil, periyodik olarak boşalmak için tasarlanmış görünüyor — ve bu boşluğu bir kayıp değil, bir yatırım olarak görmeyi öğrenmek gerekiyor.`
  },
  {
    author: "mertdemir", tags: ["sağlık", "gelişim"],
    title: "Uykunun Verimlilikle İlişkisi Sandığımızdan Güçlü",
    image: img("52.jpg"),
    content: `Üniversite yıllarımda "uyku zayıfların işi" diye şaka yapardık — kim daha az uyuyup daha çok iş çıkarırsa kazanırdı sanki. Üç gece üst üste dört saat uyuyup bir projeyi yetiştirdiğimde bunu bir başarı gibi anlatırdım. Bugün o günlere baktığımda, aslında ne kadar verimsiz çalıştığımı, aynı işi dinlenmiş bir zihinle muhtemelen yarı sürede bitirebileceğimi görüyorum.

Uyku üzerine okudukça fark ettiğim şey, uykunun sadece "dinlenme" değil, aktif bir bilişsel işlem süreci olduğu. Gün içinde öğrendiklerimiz, derin uyku evrelerinde kısa süreli hafızadan uzun süreli hafızaya aktarılıyor, gereksiz bağlantılar budanıyor, önemli olanlar pekiştiriliyor. Yani az uyumak, sadece yorgun hissetmek değil, gün içinde öğrendiklerinizin bir kısmını kalıcı hâle getirme fırsatını kaçırmak demek.

Kendi hayatımda yaptığım en basit ama en etkili değişiklik, yatma saatimi sabit tutmak oldu — hafta sonu dahil. Vücudun iç saati, tutarlılığa tutarsızlıktan çok daha iyi tepki veriyor; hafta içi erken yatıp hafta sonu geç kalkmak, kendimize her Pazartesi hafif bir "jet lag" yaşatmakla aynı şey. Bu küçük değişiklik, kafein tüketimimi azalttı, öğleden sonraki enerji düşüşlerimi büyük ölçüde ortadan kaldırdı.

Artık bir işi yetiştirmek için uykudan feragat etmeyi bir fedakarlık değil, kısa vadeli bir kazanç için uzun vadeli bir borç almak olarak görüyorum. O borç, ertesi gün daha yavaş düşünme, daha kolay sinirlenme, daha zayıf karar verme olarak geri ödeniyor — ve bu geri ödeme, genelde kazandığımız birkaç saatten çok daha pahalıya mal oluyor.`
  },
  {
    author: "mertdemir", tags: ["sağlık", "gelişim"],
    title: "Hareketsizlik Çağında Küçük Alışkanlıkların Gücü",
    image: img("53.jpg"),
    content: `Masa başı bir işte çalışıyorum ve bir gün fark ettim ki sabah 9'dan akşam 6'ya kadar, öğle yemeği hariç, neredeyse hiç yerimden kalkmıyorum. Spor salonuna haftada üç kez gitmem, bu dokuz saatlik hareketsizliği telafi ettiğim yanılgısına kapılmama neden oluyordu — oysa araştırmalar, uzun süreli oturmanın metabolik etkilerinin, günlük bir egzersiz rutiniyle tam olarak dengelenemeyebileceğini gösteriyor.

Bu farkındalıktan sonra büyük bir değişiklik yapmak yerine, küçük bir kural koydum: her 50 dakikada bir, en az iki dakika ayağa kalkmak. Alarm kurdum, ilk haftalarda garip hissettirdi, meslektaşlarım "neden sürekli kalkıp iniyorsun" diye sordu. Ama birkaç ay sonra bu, bilinçli bir çaba olmaktan çıkıp otomatik bir alışkanlığa dönüştü.

Etkisi, beklediğimden daha belirgin oldu — sadece fiziksel olarak değil, zihinsel olarak da. O iki dakikalık molalar, aslında birer "reset" görevi görüyor: uzun bir toplantı ya da zorlu bir problem sonrası kafamı toparlamama yardımcı oluyor. Bazen o kısa yürüyüş sırasında, masada saatlerce bulamadığım bir çözüm, kendiliğinden aklıma geliyor.

Sağlık konusunda genelde büyük dönüşümler hayal ediyoruz — maraton koşmak, tamamen değişmiş bir beslenme düzeni. Ama benim deneyimim şunu gösteriyor: en kalıcı değişiklikler, en küçük ve en sürdürülebilir olanlar. Her 50 dakikada iki dakika kalkmak, hayatınızı değiştirmeyecek gibi görünüyor — ama bir yılın sonunda, binlerce küçük hareketin toplamı, gerçekten fark yaratıyor.`
  },
  {
    author: "mertdemir", tags: ["aşk", "gelişim"],
    title: "Birlikte Büyümek: Uzun Soluklu İlişkilerde Öğrendiklerim",
    image: img("36.jpg"),
    content: `Eşimle on iki yıldır birlikteyiz ve bu süre boyunca ikimiz de en az üç kez "neredeyse tamamen farklı insanlar" hâline geldik — kariyer değişiklikleri, farklı şehirlere taşınmalar, dünya görüşümüzde kaymalar. Genç bir çiftken hayal ettiğimiz "sonsuza kadar aynı kalacağız" fikri, gerçeklikle hiç örtüşmedi — ve bu, ilk başta beni korkutmuştu.

Kişisel gelişim üzerine okuduğum kadar, uzun soluklu ilişkiler üzerine de çok şey okudum ve fark ettiğim bir örüntü var: en sağlıklı ilişkiler, "hiç değişmemek" üzerine değil, "birlikte değişebilmek" üzerine kurulu. Yani soru "aynı insan mı kalacağız" değil, "değiştikçe birbirimize yer açabilecek miyiz, yoksa büyüme birbirimizden uzaklaşmamıza mı sebep olacak" sorusu.

Bunu pratiğe dökmenin en somut yolu, düzenli olarak birbirimize "şu anda neyle ilgileniyorsun, neyi merak ediyorsun" diye sormak oldu — sadece günlük işler değil, gerçek bir merak. Bir dönem eşim resim yapmaya başladığında, ben hiçbir şey anlamasam da onunla birlikte sergilere gittim; ben kişisel gelişim konusunda derinleştiğimde o da benimle bazı kitapları okudu. Bu, birbirimizin dünyasına tamamen girmek değil, en azından kapıyı açık tutmak.

Bugün ilişkimize baktığımda, en gurur duyduğum şey "hiç değişmedik" diyebilmek değil, tam tersine, "ikimiz de çok değiştik ama hâlâ birbirimizi tanıyoruz" diyebilmek. Belki de aşkın en olgun hâli, bir insanı sabitlemek değil, değişimini merakla izlemeyi öğrenmek.`
  },
  {
    author: "ayseinal", tags: ["sağlık", "psikoloji"],
    title: "Kaygı Bir Düşman Değil, Bir Sinyal",
    image: img("54.jpg"),
    content: `Danışanlarımın çoğu terapiye ilk geldiklerinde kaygılarını "ortadan kaldırmak" istiyor — sanki kaygı, bedenlerinde bulunmaması gereken, tamamen yok edilmesi gereken bir hastalıkmış gibi. Oysa klinik psikolojide kaygının kendisi her zaman patolojik değildir; evrimsel olarak bize tehlikeyi haber vermek için gelişmiş, hayatta kalma mekanizmamızın bir parçasıdır.

Sorun, kaygının kendisi değil, bugünkü hayatımızda bu alarm sisteminin çok sık ve orantısız şekilde devreye girmesi. Atalarımız gerçek bir yırtıcıdan kaçarken devreye giren bu sistem, bugün bir e-postayı göndermeden önce, ya da bir toplantıya girmeden önce aynı şiddetle tetikleniyor — beden, gerçek bir fiziksel tehlike ile sosyal bir tehdidi tam olarak ayırt edemiyor.

Terapide danışanlarıma öğrettiğim ilk şey, kaygıyı bastırmaya çalışmak yerine onu merakla dinlemek. "Bu kaygı bana ne söylüyor olabilir?" sorusu, "bu kaygıdan nasıl kurtulurum" sorusundan çok daha üretken bir yere götürüyor bizi. Bazen kaygı, gerçekten hazırlıksız olduğumuz bir durumu işaret ediyor ve o zaman doğru tepki hazırlanmak; bazen de geçmişte öğrendiğimiz ama artık geçerli olmayan bir tehdit algısını tekrarlıyor, ve o zaman doğru tepki bu algıyı sorgulamak.

Kaygıyla ilişkimizi "savaş" yerine "diyalog" olarak kurduğumuzda, şaşırtıcı bir şey oluyor: kaygı genelde azalıyor. Çünkü bastırmaya çalıştığımız her duygu, bastırıldığı oranda daha güçlü geri dönüyor; ama dinlenen, anlaşılan bir duygu, mesajını ilettikten sonra doğal olarak yatışıyor.`
  },
  {
    author: "ayseinal", tags: ["sağlık", "psikoloji"],
    title: "Tükenmişlik Sendromunu Fark Etmenin Erken İşaretleri",
    image: img("55.jpg"),
    content: `Danışanlarımın büyük bir kısmı tükenmişlik yaşadıklarının farkına varmadan aylarca, bazen yıllarca o durumda çalışmaya devam ediyor. Çünkü tükenmişlik, bir gecede çöküşle değil, yavaş yavaş, neredeyse fark edilmeyen bir şekilde ilerliyor — ve bu yavaşlık, en tehlikeli yanı, çünkü "normal yorgunluk" ile "tükenmişlik" arasındaki çizgiyi bulanıklaştırıyor.

Psikolojide tükenmişliğin üç temel bileşeni tanımlanır: duygusal tükenme (hiçbir şey için enerjiniz kalmaması), duyarsızlaşma (işinize, hatta insanlara karşı giderek daha mesafeli, sinik bir tavır geliştirmeniz), ve kişisel başarı hissinin azalması (yaptığınız işin bir anlamı olmadığını hissetmek). Bu üçü bir arada görüldüğünde, basit bir "yorgunluk" değil, daha ciddi bir müdahale gerektiren bir durumla karşı karşıyayız demektir.

Erken işaretlerden biri, genelde en çok görmezden gelinen: bir zamanlar keyif aldığınız şeylerden artık hiçbir tat almamanız. İşinizde başarılı olduğunuz bir anın sizi mutlu etmediğini fark ettiyseniz, ya da bir tatil planının bile sizi heyecanlandırmadığını görüyorsanız, bu ciddiye alınması gereken bir sinyal. Bir diğer işaret, küçük görevlerin bile orantısız derecede yorucu gelmesi — normalde on dakikada yapacağınız bir e-postayı yazmak için kendinizi saatlerce zorlamanız.

Tükenmişlikle mücadelenin ilk adımı genelde "daha fazla dinlenmek" değil, durumu gerçekten adlandırmak. Çünkü adlandırılmayan bir durum, çözülemiyor — "biraz yorgunum" ile "tükenmişlik yaşıyorum" cümleleri arasındaki fark, sadece kelime seçimi değil, ne kadar ciddi bir müdahaleye ihtiyacınız olduğunun da bir göstergesi.`
  },
  {
    author: "ayseinal", tags: ["aşk", "psikoloji"],
    title: "Bağlanma Stilleri İlişkilerimizi Nasıl Şekillendirir",
    image: img("34.jpg"),
    content: `Danışanlık seanslarımda en çok "neden hep aynı tip ilişki döngüsüne giriyorum" sorusuyla karşılaşıyorum. Cevabı genelde, kişinin bilinçli tercihlerinden çok, çocukluğunda bakım verenleriyle kurduğu ilk bağlanma deneyimlerinde saklı. Bağlanma kuramı, hayatımızın ilk yıllarında ebeveynlerimizle kurduğumuz ilişkinin, yetişkinlikteki romantik ilişkilerimiz için bir şablon oluşturduğunu söylüyor.

Güvenli bağlanan bir kişi, genelde yakınlıktan korkmadan, ama aynı zamanda bağımsızlığını kaybetmeden ilişki kurabiliyor. Kaygılı bağlanan biri, sürekli onay arayışında, terk edilme korkusuyla partnerine aşırı yapışabiliyor. Kaçıngan bağlanan biri ise yakınlıktan rahatsızlık duyuyor, ilişki derinleştikçe geri çekilme eğiliminde oluyor. Bu stiller sabit bir kader değil — ama farkında olmadan, hayatımız boyunca tekrar eden örüntüler yaratabiliyorlar.

İşin ilginç yanı, farklı bağlanma stillerine sahip iki kişi genelde birbirini çekiyor — kaygılı bağlanan biri, kaçıngan bağlanan biriyle tanıştığında, tanıdık (ama sağlıksız) bir dinamik kuruyor: biri yaklaştıkça diğeri uzaklaşıyor, bu da ilk kişinin kaygısını daha da artırıyor. Bu döngüyü fark etmek, kırmanın ilk adımı; çünkü döngünün farkında olmayan bir çift, aynı tartışmayı farklı kelimelerle sonsuza kadar tekrar edebiliyor.

Terapide iyi haber şu: bağlanma stilleri, "kazanılmış güvenlik" denen bir süreçle değişebiliyor. Bilinçli bir çaba, doğru bir terapi süreci, hatta güvenli bağlanan bir partnerle kurulan uzun süreli bir ilişki bile, kaygılı ya da kaçıngan bir bağlanma stilini zamanla daha güvenli bir yöne kaydırabiliyor. Yani geçmişimiz bizi şekillendiriyor, ama mahkûm etmiyor.`
  },
  {
    author: "ayseinal", tags: ["aşk", "psikoloji"],
    title: "Kıskançlık Sevginin Kanıtı Değildir",
    image: img("30.jpg"),
    content: `"Beni hiç kıskanmıyor, demek ki beni gerçekten sevmiyor" cümlesini danışanlarımdan defalarca duydum. Popüler kültürde kıskançlık, genelde romantikleştirilen bir duygu — filmlerde, şarkılarda kıskanç bir sevgili, derin bir aşkın kanıtı gibi sunuluyor. Ama klinik olarak baktığımızda, kıskançlık çoğunlukla sevgiden değil, güvensizlikten besleniyor.

Sağlıklı bir ilişkide elbette bir miktar kıskançlık doğaldır — partnerinizin değerli olduğunu, onu kaybetmek istemediğinizi gösteren bir sinyal olabilir. Ama bu duygu, partnerinizin hareketlerini kısıtlamaya, telefonunu kontrol etmeye, arkadaşlarından uzaklaştırmaya dönüştüğünde, artık bir sevgi göstergesi değil, bir kontrol mekanizmasıdır — ve genelde kişinin kendi değersizlik hissinden, terk edilme korkusundan kaynaklanır.

Danışanlarımla çalışırken, kıskançlık anlarında ilk sorduğum soru "partnerin ne yaptı" değil, "bu an sende hangi eski korkuyu tetikledi" oluyor. Çoğu zaman cevap, mevcut ilişkiyle değil, geçmişte yaşanan bir terk edilme, bir aldatılma, ya da çocuklukta yeterince görülmeme deneyimiyle ilgili çıkıyor. Kıskançlık, şimdiki anı değil, genelde geçmişin çözülmemiş bir yarasını yansıtıyor.

Bu farkındalık, kıskançlığı tamamen yok saymak anlamına gelmiyor — duyguyu bastırmak yerine, kaynağını anlamak önemli. Ama bir ilişkide kıskançlığı "ne kadar çok seviyorsun" ölçütü olarak kullanmak, sağlıklı bir yakınlık yerine, giderek daralan ve güvensizleşen bir dinamiğe yol açıyor. Gerçek güven, kontrol etmeden sevebilmekte saklı.`
  },
  {
    author: "ayseinal", tags: ["hayat", "psikoloji"],
    title: "Yalnız Kalma Becerisi Neden Bu Kadar Değerli",
    image: img("32.jpg"),
    content: `"Yalnızlık" kelimesi çoğu insanda olumsuz bir çağrışım yapıyor — terk edilmişlik, izolasyon, eksiklik. Ama psikolojide önemli bir ayrım var: "yalnızlık" (istenmeyen, acı veren bir izolasyon hissi) ile "yalnız kalma becerisi" (kendi başına, rahatça, başka birine ihtiyaç duymadan var olabilme kapasitesi) birbirinden çok farklı şeyler.

Danışanlarımın önemli bir kısmı, sürekli bir ilişki içinde olmayı, hatta sürekli meşgul olmayı, kendileriyle baş başa kalmaktan kaçınmanın bir yolu olarak kullanıyor. Bir ilişki biter bitmez hemen yenisine atlamak, boş zamanı sürekli sosyal planlarla doldurmak, telefonu asla elden bırakmamak — bunların hepsi, bazen bilinçsizce, kendi düşüncelerimizle baş başa kalma anını erteleme stratejileri olabiliyor.

Oysa yalnız kalabilme becerisi, paradoksal bir şekilde, daha sağlıklı ilişkiler kurmanın temelini oluşturuyor. Kendi başınıza huzurlu olamıyorsanız, bir ilişkiye genelde "eksikliğinizi doldursun" diye giriyorsunuz — bu da partnerinize, taşıyamayacağı kadar büyük bir beklenti yüklüyor. Kendi başınıza tam hissedebilen biri olarak bir ilişkiye girdiğinizde ise, o ilişki bir ihtiyaçtan değil, gerçek bir tercihten doğuyor.

Bu beceriyi geliştirmenin en pratik yolu, küçük dozlarda başlamak: haftada bir, tamamen tek başınıza, telefonsuz bir saat geçirmek. İlk başta rahatsız edici gelebilir — zihnimiz sessizlikten kaçmaya çok alışkın. Ama zamanla, bu sessizlikte oturabilme becerisi, hayatın geri kalanına da sakin bir güven olarak yayılıyor.`
  },
  {
    author: "ayseinal", tags: ["bilim", "psikoloji"],
    title: "Nörobilim Mutluluğu Nasıl Açıklıyor",
    image: img("51.jpg"),
    content: `Mutluluk üzerine yazılan popüler kitapların çoğu, onu soyut bir kavram olarak ele alıyor — "anı yaşa", "minnettar ol" gibi tavsiyelerle. Ama son yirmi yılda nörobilim, mutluluğun beynimizde gerçekten ölçülebilir, tanımlanabilir kimyasal ve nöral süreçlere dayandığını gösterdi — ve bu bilgi, tavsiyelerin neden işe yaradığını (ya da yaramadığını) anlamamıza yardımcı oluyor.

Dopamin, genelde "mutluluk hormonu" olarak yanlış tanıtılıyor — aslında dopamin, mutluluğun kendisinden çok, bir ödülü *beklemenin* verdiği hazla ilgili. Bu yüzden bir hedefe ulaşmanın verdiği tatmin, genelde o hedefe doğru ilerlerken hissettiğimiz heyecandan daha kısa sürüyor — beynimiz, "varmak"tan çok "yolda olmak"tan ödül alacak şekilde kurulu. Bu bilgi bile tek başına, "hedefe ulaşınca mutlu olacağım" beklentisinin neden sürekli hayal kırıklığına dönüştüğünü açıklıyor.

Serotonin ise daha çok, sosyal statü ve bağlanma hissiyle ilişkili — başkaları tarafından değerli görülmek, bir topluluğa ait hissetmek, serotonin seviyelerini yükseltiyor. Oksitosin, dokunma ve yakın bağ anlarında salgılanıyor; bu yüzden fiziksel temas (bir sarılma, bir el sıkışma) gerçekten ölçülebilir bir ruh hâli değişimi yaratabiliyor. Endorfinler ise fiziksel aktivite ve kahkaha ile ortaya çıkıyor — "egzersiz ruh hâlini iyileştirir" klişesinin arkasında gerçek bir biyokimya var.

Bu bilgilerin pratik değeri şurada: mutluluğu tek bir büyük olaydan (bir terfi, bir ilişki) beklemek yerine, gün içinde bu dört sistemi besleyen küçük eylemleri bilinçli olarak biriktirmek — kısa bir yürüyüş, bir sarılma, küçük bir hedefe doğru ilerleme hissi, bir arkadaşla anlamlı bir sohbet. Mutluluk, tek bir varış noktası değil, günlük olarak beslenmesi gereken bir biyokimyasal denge.`
  },
  {
    author: "burakaydin", tags: ["bilim", "finans"],
    title: "Davranışsal Ekonomi: Neden Mantıksız Kararlar Veririz",
    image: img("53.jpg"),
    content: `Klasik ekonomi teorisi, insanları "rasyonel aktörler" olarak tanımlar — her zaman kendi çıkarına en uygun, mantıklı kararı veren varlıklar. Finans dünyasında yıllarca çalıştıktan sonra söyleyebilirim ki, bu varsayım gerçeklikle neredeyse hiç örtüşmüyor. İnsanlar, özellikle para söz konusu olduğunda, şaşırtıcı derecede tutarlı şekillerde "mantıksız" davranıyor — ve davranışsal ekonomi, tam olarak bu tutarlı mantıksızlıkları inceliyor.

En çarpıcı örneklerden biri "kayıptan kaçınma" denen önyargı: insanlar, 100 TL kazanmanın verdiği mutluluktan, 100 TL kaybetmenin verdiği acıyı çok daha yoğun hissediyor — araştırmalar bu oranı yaklaşık 2'ye 1 olarak gösteriyor. Bu, neden insanların değeri düşen bir hisseyi "belki geri döner" diyerek elde tutmaya devam ettiğini, ama değeri yükselen bir hisseyi çok erken sattığını açıklıyor — kayıp acısından kaçınmak, kazanç fırsatını değerlendirmekten daha güçlü bir dürtü.

Bir diğer önemli kavram "çapalama etkisi" — ilk gördüğümüz sayı, sonraki tüm değerlendirmelerimizi etkiliyor. Bir ürünün "eskiden 500 TL, şimdi 300 TL" diye satılması, aslında 300 TL'nin "ucuz" olup olmadığına dair hiçbir bağımsız bilgi vermiyor, ama beynimiz otomatik olarak 500 TL'yi referans alıp bir kazanç hissi yaratıyor. Yatırım kararlarında da aynı şey oluyor: bir hisseyi aldığımız fiyat, onun gerçek değerinden bağımsız olarak, zihnimizde bir referans noktası hâline geliyor.

Bu önyargıları bilmek, onlardan tamamen kurtulmamızı sağlamıyor — beynimiz bu şekilde çalışmaya devam ediyor. Ama bilinçli farkındalık, en azından büyük finansal kararlar öncesinde durup "bu kararı gerçek verilere mi, yoksa bir önyargıya mı dayanarak veriyorum" diye sormamızı sağlıyor. Bazen en iyi finansal strateji, piyasayı değil, kendi zihnimizi anlamaktan geçiyor.`
  },
  {
    author: "burakaydin", tags: ["hayat", "finans"],
    title: "Parayla Kurduğumuz İlişki Aslında Bir Alışkanlık Meselesi",
    image: img("33.jpg"),
    content: `Danışmanlık yaptığım insanların bütçelerine baktığımda, en çok fark ettiğim şey gelir seviyesinin, finansal huzurla doğrudan orantılı olmaması. Yüksek maaşlı ama sürekli borç içinde olan insanlar gördüm, mütevazı bir gelirle tamamen huzurlu bir finansal hayat kuran insanlar da gördüm. Aradaki fark, kazanılan para değil, parayla kurulan alışkanlıklar ve duygusal ilişki.

Çoğu insan, para yönetimini bir matematik problemi gibi görüyor — oysa büyük ölçüde bir davranış problemi. Bütçe yapmayı bilmemek nadiren asıl sorun; asıl sorun, o bütçeye sadık kalmayı zorlaştıran duygusal tetikleyiciler: stresli bir günün ardından yapılan "kendimi ödüllendiriyorum" alışverişi, sosyal baskıyla yapılan gösterişçi harcamalar, ya da geleceği düşünmenin verdiği kaygıyı bastırmak için anlık harcamaya kaçış.

Bu yüzden danışanlarıma ilk önerdiğim şey karmaşık bir tablo değil, basit bir fark: her harcamadan önce üç saniye durup "bunu neden alıyorum — ihtiyaçtan mı, yoksa şu anki duygumu yönetmek için mi" diye sormak. Bu küçük duraklama, dürtüsel harcamaların büyük bir kısmını otomatik olarak azaltıyor, çünkü çoğu dürtüsel satın alma, bilinçli bir değerlendirmeye bir kez maruz kaldığında cazibesini kaybediyor.

Finansal sağlık, bence, zenginlikten çok tutarlılıkla ilgili. Yüksek gelirli ama tutarsız harcayan biri, mütevazı gelirli ama tutarlı tasarruf eden birinden genelde daha kırılgan bir finansal pozisyonda oluyor. Parayla barışık olmak, büyük bir servet biriktirmekten önce, küçük ve tekrarlanan davranışları fark etmekle başlıyor.`
  },
  {
    author: "burakaydin", tags: ["yazılım", "finans"],
    title: "Fintech'te Yapay Zeka: Hype mı, Gerçek Dönüşüm mü",
    image: img("37.jpg"),
    content: `Finans sektöründe on beş yıldır çalışıyorum ve bu süre zarfında "her şeyi değiştirecek" diye lanse edilen pek çok teknolojiyi gördüm — bazıları gerçekten dönüştürücü oldu, çoğu birkaç yıl içinde unutuldu. Yapay zekanın fintech'teki rolü hakkında konuşurken bu geçmişi hatırlamak önemli, çünkü hem gerçek bir dönüşümün hem de abartılı bir hype'ın izlerini aynı anda görüyoruz.

Gerçek ve ölçülebilir etkiler kesinlikle var: kredi risk değerlendirmesinde, geleneksel kredi skorlama modellerinin göremediği örüntüleri (örneğin, düzensiz ama tutarlı gelire sahip serbest çalışanların gerçek ödeme kapasitesini) tespit edebilen makine öğrenmesi modelleri, finansal içermeyi gerçekten artırdı. Dolandırıcılık tespitinde, insan gözünün fark edemeyeceği hızda ve ölçekte anormal işlem örüntülerini yakalamak, bankacılık sektöründe milyarlarca dolarlık kayıpları önlüyor.

Ama "AI destekli yatırım danışmanlığı" gibi alanlarda tablo daha karışık. Birçok robo-advisor platformu, aslında oldukça basit, kural tabanlı bir portföy dengeleme mantığını "yapay zeka" diye pazarlıyor — gerçek bir öğrenme ya da kişiselleştirme olmadan. Bu pazarlama abartısı, kullanıcıların teknolojiye gerçekte sahip olmadığı bir güven duymasına neden olabiliyor, özellikle piyasa dalgalandığında.

Benim pratik önerim, bir finans ürününü değerlendirirken "AI" kelimesine değil, somut sonuçlara bakmak: bu sistem, geçmiş veride gerçekten ölçülebilir bir iyileşme sağlamış mı, yoksa sadece pazarlama dilinde mi "akıllı"? Fintech'te gerçek değer yaratan yapay zeka uygulamaları genelde en az konuşulanlar — arka planda sessizce riski azaltan, dolandırıcılığı önleyen sistemler; en çok reklamı yapılanlar ise genelde en az kanıtlanmış olanlar.`
  },
  {
    author: "burakaydin", tags: ["bilim", "finans"],
    title: "Bileşik Getirinin Sihri: Basit Matematik, Büyük Sonuçlar",
    image: img("55.jpg"),
    content: `Einstein'a atfedilen (gerçekliği tartışmalı olsa da) "bileşik faiz, evrenin en güçlü kuvvetidir" sözü, abartılı gelebilir ama finans dünyasında geçirdiğim yıllar bana bu fikrin özünde haklı olduğunu gösterdi. Bileşik getiri, basit bir matematik kavramı ama insan sezgisi bu kavramı doğru değerlendirmekte sistematik olarak başarısız oluyor — çünkü üstel büyüme, doğrusal düşünmeye alışkın beynimiz için gerçekten karşı-sezgisel.

Somut bir örnek vermek gerekirse: 25 yaşında aylık 1000 TL yatırıma başlayıp yıllık ortalama yüzde 8 getiri elde eden biri, 65 yaşına geldiğinde yaklaşık 3,5 milyon TL birikime sahip olabilir. Aynı miktarı 35 yaşında başlayan biri ise, sadece on yıl geç başladığı için, 65 yaşında yaklaşık 1,5 milyon TL'ye ulaşabilir — yatırılan toplam para arasındaki fark sadece 120.000 TL iken, sonuçtaki fark 2 milyon TL'nin üzerinde. Bu, "zaman"ın, finansal büyümede "miktar"dan çoğu zaman daha belirleyici bir faktör olduğunu gösteriyor.

Bu matematiği anlamak, insanları genç yaşta yatırıma başlamaya ikna etmek için güçlü bir araç, ama aynı zamanda ters yönde de çalışıyor: yüksek faizli kredi kartı borcu da aynı bileşik mantıkla büyüyor, sadece sizin aleyhinize. Yüzde 40'ın üzerinde yıllık faiz oranlarına sahip bir kredi kartı borcunu asgari ödemeyle taşımak, bileşik faizin ne kadar hızlı bir şekilde küçük bir borcu kontrolden çıkmış bir yüke dönüştürebileceğinin en acı örneği.

Finansal okuryazarlık denince akla genelde karmaşık yatırım stratejileri geliyor, ama benim gözlemim şu: insanların finansal hayatlarını en çok etkileyen tek kavram, muhtemelen bileşik getirinin bu basit ama güçlü matematiği. Erken başlamak, mükemmel bir strateji seçmekten neredeyse her zaman daha önemli.`
  },
  {
    author: "elifyilmaz", tags: ["sanat", "yazılım"],
    title: "Kodun da Bir Estetiği Var: Temiz Kod Üzerine",
    image: img("47.jpg"),
    content: `Bir gün eski bir projeyi açtığımda, altı ay önce yazdığım bir fonksiyonu anlamakta zorlandım — kendi yazdığım kodu. O an fark ettim ki kod sadece makinenin anlaması için değil, insanların (ve altı ay sonraki kendiniz dahil) okuması için de yazılıyor. Bu farkındalık, kod yazma şeklimi kökten değiştirdi.

Güzel bir manzara resmine baktığınızda, gözünüz nasıl doğal bir akışla dolaşıyorsa, iyi yazılmış bir kod da öyle okunmalı — isimlendirmeler net, fonksiyonlar tek bir işi yapıyor, mantık akışı yukarıdan aşağıya doğal bir hikaye anlatıyor. Değişken adı olarak "x" ya da "data2" kullanmak, bir ressamın tuvaline rastgele fırça darbeleri atması gibi — teknik olarak "çalışabilir" ama hiçbir anlam taşımıyor.

İlginç olan şu: temiz kod yazmak, genelde daha fazla zaman almıyor, sadece farklı bir düşünme disiplini gerektiriyor. İyi bir isim bulmak için beş saniye daha düşünmek, altı ay sonra o kodu anlamak için harcanacak on dakikayı önlüyor. Bu, sanatta olduğu gibi — bir ressam ilk fırça darbesinden önce kompozisyonu düşünür, rastgele boyamaz; iyi bir geliştirici de kodu yazmadan önce yapıyı düşünür.

Bugün junior geliştiricilere verdiğim en önemli tavsiye, "çalışan kod" ile "iyi kod" arasındaki farkı erken fark etmeleri. Her ikisi de aynı sonucu üretebilir, ama biri bir sonraki kişiye (genelde sizin gelecekteki haliniz) bir hediye bırakır, diğeri bir bulmaca. Temiz kod, estetik bir lüks değil — uzun vadede, bir ekibin sağlığı için gerçek bir gereklilik.`
  }
];

const run = async () => {
  await connectDB();

  // 1) Mevcut makaleleri ve bunlara bağlı sarkan referansları temizle
  const existingArticleIds = (await Article.find().select("_id")).map((a) => a._id);
  console.log(`${existingArticleIds.length} mevcut makale siliniyor...`);

  await Article.deleteMany({});
  await User.updateMany({}, { $set: { library: [], readingHistory: [] } });

  const articleChatRooms = await ChatRoom.find({ type: "article" }).select("_id");
  const articleChatRoomIds = articleChatRooms.map((r) => r._id);
  await ChatMessage.deleteMany({ room: { $in: articleChatRoomIds } });
  await ChatRoom.deleteMany({ type: "article" });

  await Notification.deleteMany({ article: { $exists: true, $ne: null } });

  console.log("Temizlik tamamlandı (makaleler, kütüphane/okuma geçmişi referansları, makale chat odaları, makale bildirimleri).");

  // 2) Tag'leri upsert et
  const tagDocs = {};
  for (const name of TAG_NAMES) {
    let tag = await Tag.findOne({ name });
    if (!tag) tag = await Tag.create({ name });
    tagDocs[name] = tag;
  }

  // 3) Yazar kullanıcılarını bul (seedTestData.js ile oluşturulmuş olmaları gerekiyor)
  const usernames = [...new Set(ARTICLE_SEEDS.map((a) => a.author))];
  const userDocs = {};
  for (const username of usernames) {
    const user = await User.findOne({ username });
    if (!user) throw new Error(`Kullanıcı bulunamadı: ${username} — önce seedTestData.js çalıştırılmalı.`);
    userDocs[username] = user;
  }

  // 4) Makaleleri oluştur
  const createdArticles = [];
  for (const seed of ARTICLE_SEEDS) {
    const tagIds = seed.tags.map((t) => tagDocs[t]._id);
    const article = await Article.create({
      title: seed.title,
      content: seed.content,
      author: userDocs[seed.author]._id,
      tags: tagIds,
      image: seed.image
    });
    createdArticles.push(article);
  }
  console.log(`${createdArticles.length} yeni makale oluşturuldu.`);

  // 5) Gerçekçilik için rastgele favori/kütüphane dağıtımı
  const allUserIds = Object.values(userDocs).map((u) => u._id);
  for (const article of createdArticles) {
    const otherUserIds = allUserIds.filter((id) => id.toString() !== article.author.toString());
    const favoriteCount = Math.floor(Math.random() * (otherUserIds.length + 1));
    const shuffled = [...otherUserIds].sort(() => Math.random() - 0.5);
    article.favorites = shuffled.slice(0, favoriteCount);
    await article.save();

    if (Math.random() > 0.4) {
      const randomReaderName = usernames[Math.floor(Math.random() * usernames.length)];
      const reader = await User.findById(userDocs[randomReaderName]._id);
      if (!reader.library.includes(article._id)) {
        reader.library.push(article._id);
        await reader.save();
      }
    }
  }
  console.log("Favori/kütüphane verileri dağıtıldı.");

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed hatası:", err);
  process.exit(1);
});
