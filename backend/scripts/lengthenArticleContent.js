import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Article from "../models/Article.js";

// Test verisindeki makale içerikleri çok kısaydı (UI testinde scroll/progress-bar/
// line-clamp gibi şeyleri denemek zordu) — bu script kısa olanları birkaç genel
// paragrafla uzatır. Zaten yeterince uzun olanlara dokunmaz, tekrar çalıştırmak güvenli.
const MIN_WORDS = 150;

const EXTENSION_BLOCKS = [
  "Bu konuya yeni başlayanlar için en büyük tuzak, çok fazla kaynaktan aynı anda öğrenmeye çalışmaktır. Tek bir kaynağa odaklanıp onu sonuna kadar takip etmek, dağınık bilgi parçalarını bir araya getirmeye çalışmaktan çok daha etkilidir. Küçük adımlarla ilerlemek, büyük bir sıçrama yapmaya çalışmaktan her zaman daha sürdürülebilirdir.",
  "Pratikte karşılaşılan zorlukların çoğu, teoriyi bilmemekten değil, teoriyi ne zaman ve nasıl uygulayacağını bilmemekten kaynaklanır. Bu yüzden okuduğunuz her kavramı küçük bir örnek üzerinde denemek, kalıcı öğrenmenin en güvenilir yoludur. Hata yapmaktan çekinmemek, öğrenme sürecinin doğal ve gerekli bir parçasıdır.",
  "Uzun vadede fark yaratan şey, kısa süreli yoğun çabalar değil, tutarlı ve düzenli bir alışkanlıktır. Haftada birkaç kez kısa süreli ama odaklanmış çalışmalar, ayda bir kez yapılan uzun ama dağınık çalışmalardan çok daha fazla katma değer sağlar. Bu ilke burada anlatılan konu için de geçerlidir.",
  "Toplulukla etkileşim halinde olmak, yalnız çalışmaktan çok daha hızlı ilerlemenizi sağlar. Başkalarının sorduğu sorular ve verdiği cevaplar, sizin aklınıza gelmeyen bakış açılarını görmenizi sağlar. Bu yüzden burada anlatılanları başkalarıyla tartışmak, konuyu gerçekten özümsemenin en etkili yollarından biridir.",
  "Kısa vadeli sonuçlara odaklanmak yerine sürecin kendisinden keyif almayı öğrenmek, motivasyonu uzun vadede korumanın en sağlam yoludur. İlerleme bazen doğrusal olmaz, duraklamalar ve geri dönüşler de bu sürecin doğal bir parçasıdır. Önemli olan pes etmeden devam edebilmektir.",
  "Elde edilen bilgiyi yazıya dökmek veya başkasına anlatmak, o bilgiyi gerçekten anlayıp anlamadığınızı test etmenin en iyi yollarından biridir. Bir konuyu basitçe anlatamıyorsanız, muhtemelen onu henüz tam olarak kavramamışsınız demektir. Bu yüzden öğrendiklerinizi düzenli olarak özetlemek faydalı bir alışkanlıktır.",
];

const pickExtension = () =>
  EXTENSION_BLOCKS
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .join("\n\n");

const run = async () => {
  await connectDB();

  const articles = await Article.find();
  let updatedCount = 0;

  for (const article of articles) {
    const wordCount = article.content.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount >= MIN_WORDS) continue;

    article.content = `${article.content}\n\n${pickExtension()}`;
    await article.save();
    updatedCount++;
  }

  console.log(`${updatedCount} makale uzatıldı (toplam ${articles.length} makale tarandı).`);

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("Hata:", err);
  process.exit(1);
});
