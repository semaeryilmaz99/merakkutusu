import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Article from "../models/Article.js";
import Tag from "../models/Tag.js";

// Belirtilen kullanıcıların her birine 2 yeni makale ekler. Aynı başlık zaten
// varsa atlar (tekrar çalıştırmak güvenli). Postman testlerinden kalma
// otomatik-üretilmiş hesaplar (owner..., other..., testuser) kapsam dışı —
// bunlar gerçek/demo kullanıcı değil, test artığı.
const ARTICLES_BY_USERNAME = {
  semaeryilmaz: [
    { tags: ["yazılım"], title: "Kod İncelemesinde Dikkat Edilmesi Gerekenler", content: "İyi bir kod incelemesi sadece hata bulmak değil, bilgi paylaşımıdır. Yapıcı geri bildirim vermek, küçük PR'lar açmak ve otomatik lint/test kontrollerine güvenmek, ekip içi kod kalitesini uzun vadede artırır." },
    { tags: ["gelişim"], title: "Uzaktan Çalışmada Zaman Yönetimi", content: "Uzaktan çalışırken ev ile iş arasındaki sınırın belirsizleşmesi, verimliliği düşürebilir. Belirli çalışma saatleri koymak, molaları planlamak ve fiziksel bir 'çalışma alanı' oluşturmak odaklanmayı kolaylaştırır." },
  ],
  semaeryilmaz2: [
    { tags: ["tasarım"], title: "Minimalist Arayüz Tasarımının Gücü", content: "Az öğeyle çok şey anlatmak, iyi bir arayüz tasarımının temelidir. Gereksiz görsel gürültüyü azaltmak, kullanıcının asıl göreve odaklanmasını sağlar ve deneyimi hafifletir." },
    { tags: ["finans"], title: "Kişisel Bütçe Nasıl Yönetilir", content: "Gelir-gider takibi yapmadan tasarruf hedefi koymak zordur. Basit bir tablo veya uygulamayla aylık harcamaları kategorilere ayırmak, nereye ne kadar harcandığını görünür kılar." },
  ],
  elifyilmaz: [
    { tags: ["tasarım"], title: "CSS Grid ile Karmaşık Layout'lar", content: "Flexbox tek boyutlu düzenler için idealken, CSS Grid iki boyutlu karmaşık sayfa yapıları için çok daha güçlü bir araçtır. Bu yazıda grid-template-areas ile okunabilir layout'lar kurmayı inceliyoruz." },
    { tags: ["teknoloji"], title: "Erişilebilirlik (a11y) Neden Önemli", content: "Erişilebilir bir arayüz sadece ekran okuyucu kullanan kullanıcılar için değil, herkes için daha kullanılabilir bir deneyim demektir. Semantik HTML ve doğru kontrast oranları basit ama etkili adımlardır." },
  ],
  canozturk: [
    { tags: ["teknoloji"], title: "Docker ile Geliştirme Ortamı Kurulumu", content: "'Bende çalışıyordu' sorununu ortadan kaldırmanın en pratik yolu, geliştirme ortamını konteynerleştirmektir. docker-compose ile veritabanı, backend ve frontend servislerini tek komutla ayağa kaldırmayı anlatıyoruz." },
    { tags: ["yazılım"], title: "Kod Review Kültürü Oluşturmak", content: "Kod incelemesinin bir 'engel' değil, ekip öğrenmesinin bir parçası olarak görülmesi gerekir. Net review checklist'leri ve saygılı bir iletişim dili bu kültürün temelini oluşturur." },
  ],
  zeynepkaya: [
    { tags: ["tasarım"], title: "Tipografi Seçerken Nelere Dikkat Edilir", content: "Doğru font çifti, bir tasarımın okunabilirliğini ve karakterini belirler. Başlık ve gövde metni için kontrast oluşturan ama birbiriyle uyumlu iki font seçmek genel bir kural olarak işe yarar." },
    { tags: ["sanat"], title: "Sokak Sanatının Toplumsal Etkisi", content: "Sokak sanatı, galerilerin dışında kalan bir kitleye ulaşarak toplumsal mesajları görünür kılar. Bu yazıda farklı şehirlerden örneklerle sokak sanatının kentsel kimliğe etkisini ele alıyoruz." },
  ],
  mertdemir: [
    { tags: ["gelişim"], title: "Sabah Rutininin Verimliliğe Etkisi", content: "Güne nasıl başladığınız, günün geri kalanının tonunu belirler. Basit ama tutarlı bir sabah rutini (su içmek, kısa hareket, önceliklerin gözden geçirilmesi) odaklanmayı kolaylaştırır." },
    { tags: ["gelişim"], title: "Hedef Belirlemede SMART Yöntemi", content: "Belirsiz hedefler nadiren gerçekleşir. Spesifik, ölçülebilir, ulaşılabilir, ilgili ve zamana bağlı (SMART) hedefler koymak, ilerlemeyi somut şekilde takip etmeyi sağlar." },
  ],
  ayseinal: [
    { tags: ["psikoloji"], title: "Empati Kurmayı Öğrenmek", content: "Empati, doğuştan sabit bir özellik değil geliştirilebilen bir beceridir. Aktif dinleme ve yargılamadan önce anlamaya çalışmak, empati kurma pratiğinin temel taşlarıdır." },
    { tags: ["psikoloji"], title: "Stres Yönetiminde Nefes Teknikleri", content: "Kontrollü nefes egzersizleri, sinir sistemini sakinleştirerek anlık stres tepkisini azaltabilir. 4-7-8 tekniği gibi basit yöntemler günlük hayata kolayca entegre edilebilir." },
  ],
  burakaydin: [
    { tags: ["finans"], title: "Emeklilik İçin Erken Yatırım Yapmanın Önemi", content: "Bileşik getirinin gücü zamanla katlanarak artar — erken başlamak, düşük miktarlarla bile uzun vadede büyük fark yaratabilir. Bu yazıda erken yatırımın matematiğini basitçe anlatıyoruz." },
    { tags: ["finans"], title: "Kripto Para Piyasasında Risk Algısı", content: "Yüksek getiri potansiyeli, yüksek risk anlamına da gelir. Kripto varlıklara yatırım yapmadan önce portföyünüzün ne kadarını riske atmaya hazır olduğunuzu net şekilde belirlemek gerekir." },
  ],
};

const seed = async () => {
  await connectDB();

  let createdCount = 0;
  let skippedCount = 0;

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
        skippedCount++;
        continue;
      }

      const tagIds = [];
      for (const tagName of seedArticle.tags) {
        let tag = await Tag.findOne({ name: tagName });
        if (!tag) tag = await Tag.create({ name: tagName });
        tagIds.push(tag._id);
      }

      await Article.create({
        title: seedArticle.title,
        content: seedArticle.content,
        author: user._id,
        tags: tagIds,
        views: Math.floor(Math.random() * 400) + 20,
      });

      console.log(`Oluşturuldu: "${seedArticle.title}" (${username})`);
      createdCount++;
    }
  }

  console.log(`\n${createdCount} yeni makale oluşturuldu, ${skippedCount} zaten vardı.`);

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error("Hata:", err);
  process.exit(1);
});
