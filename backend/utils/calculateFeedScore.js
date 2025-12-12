export default function calculateFeedScore(article, tagWeights, favoriteTagIds) {

  // --- 1) Tag ağırlığı ---
  let tagWeightScore = 0;

  if (article.tags) {
    article.tags.forEach(tag => {
      const tagId = tag._id?.toString();
      if (tagWeights[tagId]) {
        tagWeightScore += tagWeights[tagId]; // geçmişe göre ağırlık
      }
      if (favoriteTagIds.includes(tagId)) {
        tagWeightScore += 2; // favori tag boost
      }
    });
  }

  // --- 2) Popülerlik skoru ---
  const popularityBoost = 
    (article.favorites?.length || 0) * 2 +
    (article.comments?.length || 0);

  // --- 3) Recency boost (yeni makaleler öne çıksın) ---
  const hoursDiff = (Date.now() - new Date(article.createdAt)) / 36e5;
  const recencyBoost = Math.max(0, 48 - hoursDiff); // 48 saat içinde ekstra puan

  const finalScore = tagWeightScore + popularityBoost + recencyBoost;

  return finalScore;
}
