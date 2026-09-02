import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Article from "../models/Article.js";

// Kullanıcı makalelerin daha da uzun olmasını istedi — her makaleye (kısa/uzun
// ayrımı yapmadan) 5 ek paragraf daha ekler. lengthenArticleContent.js'ten farklı
// olarak koşulsuz çalışır (idempotent değil — tekrar çalıştırılırsa tekrar 5 paragraf
// daha ekler, bilerek bu şekilde bırakıldı çünkü amaç "daha da uzun" yapmak).
const PARAGRAPH_POOL = [
  "Zamanla biriken küçük iyileştirmeler, tek seferde yapılan büyük değişikliklerden daha kalıcı sonuçlar doğurur. Bu nedenle mükemmeli beklemek yerine, bugün yapılabilecek en küçük ilerlemeye odaklanmak çoğu zaman en akıllıca yaklaşımdır.",
  "Farklı kaynaklardan gelen bakış açılarını karşılaştırmak, bir konuyu tek taraflı öğrenmenin getirdiği kör noktaları ortadan kaldırır. Eleştirel düşünme, okunan her bilgiyi sorgulamaktan değil, doğru sorularla derinleştirmekten geçer.",
  "Bir konuda ustalaşmanın kestirme bir yolu yoktur; ama doğru geri bildirim döngüleri süreci belirgin şekilde hızlandırabilir. Yaptığınız işi düzenli olarak gözden geçirmek, nerede takıldığınızı erken fark etmenizi sağlar.",
  "Bilgiyi pasif olarak tüketmek yerine ona aktif olarak müdahale etmek — not almak, soru sormak, uygulamak — öğrenmeyi kalıcı hale getirir. Pasif okuma, kısa vadede rahat hissettirse de uzun vadede çok az iz bırakır.",
  "Karmaşık görünen konular genellikle basit fikirlerin üst üste binmesinden oluşur. Temel kavramları sağlam öğrenmek, ileride karşılaşılacak daha ileri düzey içerikleri anlamayı çok daha kolay hale getirir.",
  "Zorlandığınız noktada hemen pes etmek yerine, sorunu farklı açılardan ele almayı denemek genellikle bir çözüm yolu açar. Zorluk, öğrenmenin bir engeli değil, doğal ve gerekli bir parçasıdır.",
  "Zaman baskısı altında öğrenmeye çalışmak, çoğu zaman yüzeysel bir kavrayışla sonuçlanır. Aceleye getirmeden, konuyu gerçekten anlamaya vakit ayırmak, sonradan tekrar tekrar geri dönme ihtiyacını azaltır.",
  "Bir topluluğun parçası olmak sadece motivasyon açısından değil, farklı deneyimlerden öğrenmek açısından da değerlidir. Başkalarının karşılaştığı sorunlar ve bulduğu çözümler, sizin kendi yolunuzu kısaltabilir.",
  "Deneme yanılma, doğru rehberlikle birleştiğinde çok daha verimli hale gelir. Sadece kendi başınıza denemek yerine, deneyimli kişilerin geri bildirimini almak, yanlış yönlerde harcanan zamanı azaltır.",
  "Küçük başarıları kutlamak, uzun bir öğrenme sürecinde motivasyonu canlı tutmanın basit ama etkili bir yoludur. Her adım, nihai hedefe götüren yolun bir parçası olarak görülmelidir.",
  "Sonuçta önemli olan, mükemmel bir başlangıç yapmak değil, tutarlı bir şekilde ilerlemeye devam etmektir. Zamanla birikimli etkiler, başlangıçta göze çarpmayan ama sonunda belirleyici olan farkı yaratır.",
];

const pickFiveParagraphs = () =>
  PARAGRAPH_POOL
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, 5)
    .join("\n\n");

const run = async () => {
  await connectDB();

  const articles = await Article.find();

  for (const article of articles) {
    article.content = `${article.content}\n\n${pickFiveParagraphs()}`;
    await article.save();
  }

  console.log(`${articles.length} makaleye 5'er paragraf daha eklendi.`);

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("Hata:", err);
  process.exit(1);
});
