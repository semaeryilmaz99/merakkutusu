import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Article from "../models/Article.js";
import Tag from "../models/Tag.js";

// Test/demo verisi üretir. Tekrar çalıştırılırsa email/tag adına göre var olanları
// atlar (tag'ler upsert edilir, kullanıcılar/makaleler var olan kayıt varsa yeniden oluşturulmaz).
const TEST_PASSWORD = "Test1234";

const TAG_NAMES = ["teknoloji", "tasarım", "sanat", "yazılım", "gelişim", "psikoloji", "finans"];

const USER_SEEDS = [
  { username: "elifyilmaz", email: "elif.yilmaz.test@merakkutusu.dev", bio: "Frontend geliştirici, UI/UX tutkunu." },
  { username: "canozturk", email: "can.ozturk.test@merakkutusu.dev", bio: "Yazılım mühendisi, açık kaynak katkıcısı." },
  { username: "zeynepkaya", email: "zeynep.kaya.test@merakkutusu.dev", bio: "Grafik tasarımcı ve illüstratör." },
  { username: "mertdemir", email: "mert.demir.test@merakkutusu.dev", bio: "Kişisel gelişim ve verimlilik üzerine yazıyorum." },
  { username: "ayseinal", email: "ayse.inal.test@merakkutusu.dev", bio: "Psikolog, zihin sağlığı üzerine içerikler üretiyorum." },
  { username: "burakaydin", email: "burak.aydin.test@merakkutusu.dev", bio: "Finans ve yatırım yazarı." },
];

const ARTICLE_SEEDS = [
  { author: "elifyilmaz", tags: ["teknoloji", "yazılım"], title: "React 19 ile Gelen Yenilikler", content: "React 19, Server Component'ler ve yeni hook'larla geliştirici deneyimini önemli ölçüde iyileştiriyor. Bu yazıda en dikkat çekici değişiklikleri ve projelerinize nasıl entegre edebileceğinizi ele alıyoruz. Suspense ve concurrent rendering artık daha stabil, form aksiyonları native destekleniyor." },
  { author: "elifyilmaz", tags: ["tasarım"], title: "Tutarlı Bir Renk Paleti Nasıl Oluşturulur", content: "İyi bir tasarım sistemi, tutarlı bir renk paletiyle başlar. Bu yazıda marka renklerini nasıl belirleyeceğinizi, erişilebilirlik kontrastını nasıl koruyacağınızı ve Tailwind gibi araçlarla bunu nasıl uygulayacağınızı anlatıyoruz." },
  { author: "canozturk", tags: ["yazılım", "teknoloji"], title: "Node.js'te Asenkron Hata Yönetimi", content: "Express uygulamalarında try/catch tekrarından kurtulmanın en temiz yolu merkezi bir error handler kurmaktır. Bu yazıda asyncHandler pattern'ini, merkezi middleware'leri ve gerçek dünya örneklerini inceliyoruz." },
  { author: "canozturk", tags: ["teknoloji"], title: "MongoDB'de İndeksleme Stratejileri", content: "Doğru indeksleme, sorgu performansını 10 kata kadar artırabilir. Compound index'ler, TTL index'ler ve explain() ile sorgu planı analizi bu yazının konusu." },
  { author: "canozturk", tags: ["yazılım"], title: "Socket.IO ile Gerçek Zamanlı Uygulamalar", content: "Oda bazlı mimari, authentication middleware'i ve ölçeklenebilirlik konularına değinen pratik bir Socket.IO rehberi." },
  { author: "zeynepkaya", tags: ["sanat", "tasarım"], title: "Dijital İllüstrasyona Yeni Başlayanlar İçin Rehber", content: "Doğru fırça ayarlarından katman yönetimine, dijital illüstrasyona başlarken bilmeniz gereken her şey burada. Procreate ve Photoshop karşılaştırması dahil." },
  { author: "zeynepkaya", tags: ["sanat"], title: "Renk Teorisinin Temelleri", content: "Tamamlayıcı renkler, analog paletler ve duygusal etkileri — sanat eserlerinizde renk kullanımını bilinçli hale getirin." },
  { author: "mertdemir", tags: ["gelişim"], title: "Derin Çalışma (Deep Work) Nasıl Uygulanır", content: "Dikkat dağıtıcılardan arınmış, odaklanmış çalışma blokları verimliliğinizi katlayabilir. Cal Newport'un yöntemlerinden pratik çıkarımlar." },
  { author: "mertdemir", tags: ["gelişim", "psikoloji"], title: "Alışkanlık Döngüsünü Anlamak", content: "Sinyal, rutin ve ödül — alışkanlıkların nörolojik temelini anlamak, kalıcı değişim yaratmanın ilk adımıdır." },
  { author: "ayseinal", tags: ["psikoloji"], title: "Kaygıyla Başa Çıkma Teknikleri", content: "Bilişsel davranışçı terapi temelli, günlük hayatta uygulanabilir kaygı yönetimi teknikleri üzerine bir derleme." },
  { author: "ayseinal", tags: ["psikoloji", "gelişim"], title: "Duygusal Zeka Neden Önemli", content: "IQ kadar, hatta bazı bağlamlarda daha fazla belirleyici olan duygusal zekanın bileşenleri ve geliştirme yolları." },
  { author: "burakaydin", tags: ["finans"], title: "Bireysel Yatırımcılar İçin Risk Yönetimi", content: "Portföy çeşitlendirmesi, pozisyon büyüklüğü ve duygusal karar vermekten kaçınma — temel risk yönetimi ilkeleri." },
  { author: "burakaydin", tags: ["finans", "teknoloji"], title: "Fintech'in Geleneksel Bankacılığa Etkisi", content: "Dijital cüzdanlar, açık bankacılık API'leri ve kripto varlıkların finans sektöründeki dönüştürücü etkisi." },
  { author: "burakaydin", tags: ["finans"], title: "Acil Durum Fonu Neden Şart", content: "3-6 aylık gideri karşılayacak bir acil durum fonu, finansal stresin önündeki en büyük tampondur. Nasıl biriktirilir?" },
];

const seed = async () => {
  await connectDB();

  // 1) Tag'ler (upsert — zaten varsa dokunmaz)
  const tagDocs = {};
  for (const name of TAG_NAMES) {
    const tag = await Tag.findOneAndUpdate(
      { name },
      { name },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    tagDocs[name] = tag;
  }
  console.log(`Tag'ler hazır: ${TAG_NAMES.join(", ")}`);

  // 2) Kullanıcılar (email zaten varsa atla — şifre hash'i pre-save hook'u tetiklesin diye .create() kullanılıyor)
  const userDocs = {};
  for (const seedUser of USER_SEEDS) {
    let user = await User.findOne({ email: seedUser.email });
    if (!user) {
      user = await User.create({
        username: seedUser.username,
        email: seedUser.email,
        password: TEST_PASSWORD,
        bio: seedUser.bio,
        isVerified: true,
        libraryVisibility: "public",
      });
      console.log(`Kullanıcı oluşturuldu: ${user.username} (${user.email})`);
    } else {
      console.log(`Kullanıcı zaten vardı, atlandı: ${user.username}`);
    }
    userDocs[seedUser.username] = user;
  }

  // 3) Kullanıcılar arası takip ilişkileri + ilgi alanları (sadece ilk kurulumda anlamlı, tekrar
  //    çalıştırıldığında zaten var olan ilişkileri bozmamak için mevcut kullanıcıya dokunulmuyor)
  const usernames = Object.keys(userDocs);
  for (let i = 0; i < usernames.length; i++) {
    const user = userDocs[usernames[i]];
    if (user.following.length > 0) continue; // zaten kurulmuş, tekrar dokunma

    const others = usernames.filter((u) => u !== usernames[i]);
    const toFollow = [others[i % others.length], others[(i + 1) % others.length]];
    for (const targetName of toFollow) {
      const target = userDocs[targetName];
      user.following.push(target._id);
      target.followers.push(user._id);
    }

    // her kullanıcıya makalelerindeki tag'lerden birkaçını favori ilgi alanı yap
    const authored = ARTICLE_SEEDS.filter((a) => a.author === usernames[i]);
    const favTagNames = [...new Set(authored.flatMap((a) => a.tags))];
    user.favoriteTags = favTagNames.map((name) => tagDocs[name]._id);
  }
  // following/followers karşılıklı push edildiği için hepsi tek seferde, döngü bittikten sonra kaydediliyor
  for (const username of usernames) {
    await userDocs[username].save();
  }
  console.log("Takip ilişkileri ve ilgi alanları ayarlandı.");

  // 4) Makaleler (aynı başlık zaten varsa atla)
  let createdCount = 0;
  const createdArticles = [];
  for (const seedArticle of ARTICLE_SEEDS) {
    const existing = await Article.findOne({ title: seedArticle.title });
    if (existing) {
      createdArticles.push(existing);
      continue;
    }

    const author = userDocs[seedArticle.author];
    const tagIds = seedArticle.tags.map((name) => tagDocs[name]._id);

    const article = await Article.create({
      title: seedArticle.title,
      content: seedArticle.content,
      author: author._id,
      tags: tagIds,
      views: Math.floor(Math.random() * 400) + 20,
    });

    createdArticles.push(article);
    createdCount++;
  }
  console.log(`${createdCount} yeni makale oluşturuldu (toplam ${ARTICLE_SEEDS.length} makale tanımı).`);

  // 5) Rastgele favori/yorum/kütüphane ekleme (sadece bu scriptin oluşturduğu yeni makalelere)
  const allUserIds = usernames.map((u) => userDocs[u]._id);
  for (const article of createdArticles) {
    if (article.favorites.length > 0) continue; // zaten dolduruşmuş, tekrar dokunma

    const otherUserIds = allUserIds.filter((id) => id.toString() !== article.author.toString());
    const favoriteCount = Math.floor(Math.random() * otherUserIds.length);
    article.favorites = otherUserIds.slice(0, favoriteCount);

    if (otherUserIds.length > 0) {
      article.comments.push({
        user: otherUserIds[0],
        text: "Çok faydalı bir yazı olmuş, teşekkürler!",
      });
    }

    await article.save();

    // rastgele bir kullanıcının kütüphanesine ekle
    const randomReaderName = usernames[Math.floor(Math.random() * usernames.length)];
    const reader = userDocs[randomReaderName];
    if (!reader.library.includes(article._id)) {
      reader.library.push(article._id);
      await reader.save();
    }
  }
  console.log("Favori/yorum/kütüphane verileri dağıtıldı.");

  console.log("\n--- Test kullanıcıları (hepsinin şifresi aynı) ---");
  console.log(`Şifre: ${TEST_PASSWORD}`);
  USER_SEEDS.forEach((u) => console.log(`  ${u.username}  <${u.email}>`));

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed hatası:", err);
  process.exit(1);
});
