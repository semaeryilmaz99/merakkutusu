// Hacker News/Reddit tarzı zaman-ağırlıklı "hot" skoru.
// Payda üstel arttığı için eski makaleler yüksek skor için çok daha fazla
// güncel etkileşime ihtiyaç duyar — bu da "tüm zamanların en iyisi" yerine
// "şu an yükselenler" hissi verir. Yorum en güçlü sinyal (aktif katılım),
// favori orta, view en zayıf (pasif) olarak ağırlıklandırıldı.
export default function calculateTrendingScore(article) {
  const views = article.views || 0;
  const favorites = article.favorites?.length || 0;
  const comments = article.comments?.length || 0;

  const engagement = views * 1 + favorites * 3 + comments * 4;

  const ageInHours = (Date.now() - new Date(article.createdAt)) / 36e5;
  const gravity = 1.5;

  return engagement / Math.pow(ageInHours + 2, gravity);
}
