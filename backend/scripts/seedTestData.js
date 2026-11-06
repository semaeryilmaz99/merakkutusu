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

// İngilizce demo makaleleri — aynı tag taksonomisini (teknoloji/tasarım/sanat/yazılım/
// gelişim/psikoloji/finans) kullanıyor, ayrı bir İngilizce tag seti açmıyor; amaç
// platformun içerik tarafında da çok dilli olduğunu göstermek (Upwork portföyü için).
const ENGLISH_ARTICLE_SEEDS = [
  { author: "elifyilmaz", tags: ["teknoloji", "yazılım"], title: "What's New in React 19", content: "React 19 brings Server Components and new hooks that meaningfully improve the developer experience. In this piece we cover the most notable changes and how to fold them into your existing projects — Suspense and concurrent rendering are now more stable, and form actions are natively supported." },
  { author: "elifyilmaz", tags: ["tasarım"], title: "Building a Consistent Color Palette", content: "A solid design system starts with a consistent color palette. Here's how to define your brand colors, preserve accessible contrast ratios, and implement all of it with tools like Tailwind." },
  { author: "canozturk", tags: ["yazılım", "teknoloji"], title: "Async Error Handling in Node.js", content: "The cleanest way to escape repetitive try/catch blocks in Express apps is a centralized error handler. This article walks through the asyncHandler pattern, centralized middleware, and real-world examples." },
  { author: "canozturk", tags: ["teknoloji"], title: "MongoDB Indexing Strategies", content: "The right index can speed up a query by an order of magnitude. Compound indexes, TTL indexes, and reading a query plan with explain() are the focus of this piece." },
  { author: "zeynepkaya", tags: ["sanat", "tasarım"], title: "A Beginner's Guide to Digital Illustration", content: "From getting your brush settings right to managing layers, here's everything you need to know to get started with digital illustration — including a Procreate vs. Photoshop comparison." },
  { author: "zeynepkaya", tags: ["sanat"], title: "The Fundamentals of Color Theory", content: "Complementary colors, analogous palettes, and their emotional weight — understand how color choices shape the way your work is read." },
  { author: "mertdemir", tags: ["gelişim"], title: "How to Practice Deep Work", content: "Focused blocks of work, free of distraction, can multiply your output. Practical takeaways drawn from Cal Newport's methods." },
  { author: "mertdemir", tags: ["gelişim", "psikoloji"], title: "Understanding the Habit Loop", content: "Cue, routine, reward — understanding the neurological basis of habits is the first step toward making change that actually lasts." },
  { author: "ayseinal", tags: ["psikoloji"], title: "Techniques for Coping with Anxiety", content: "A roundup of cognitive behavioral therapy-based techniques for managing anxiety that you can apply in everyday life." },
  { author: "ayseinal", tags: ["psikoloji", "gelişim"], title: "Why Emotional Intelligence Matters", content: "Emotional intelligence can be as decisive as IQ — sometimes more so. Its core components, and how to actually build them." },
];

const ALL_ARTICLE_SEEDS = [...ARTICLE_SEEDS, ...ENGLISH_ARTICLE_SEEDS];

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
    const authored = ALL_ARTICLE_SEEDS.filter((a) => a.author === usernames[i]);
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
  for (const seedArticle of ALL_ARTICLE_SEEDS) {
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
  console.log(`${createdCount} yeni makale oluşturuldu (toplam ${ALL_ARTICLE_SEEDS.length} makale tanımı).`);

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
