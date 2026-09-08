import User from "../models/User.js";

// Bir kullanıcının okuma geçmişine bir makaleyi ekler/günceller — makale
// zaten listede varsa viewedAt'ını günceller, yoksa sona ekler.
//
// Önceki hali iki ayrı (ve ardışık, atomik olmayan) updateOne çağrısıydı:
// önce "varsa güncelle", sonra "yoksa ekle". Aralarında bir yarış durumu
// vardı — aynı makaleyi aynı anda iki sekmede/istekte açan bir kullanıcı,
// her iki isteğin de "henüz yok" kontrolünü aynı anda geçmesi sonucu
// readingHistory'de aynı makale için iki kayıt biriktirebiliyordu (bu da
// getPersonalizedFeed/getMostReadTags'teki tag ağırlıklarını şişiriyordu).
// Tek bir aggregation-pipeline update ile atomik hale getirildi.
export default async function recordArticleView(userId, articleId) {
  await User.updateOne(
    { _id: userId },
    [
      {
        $set: {
          readingHistory: {
            $cond: [
              { $in: [articleId, { $ifNull: ["$readingHistory.article", []] }] },
              {
                $map: {
                  input: "$readingHistory",
                  as: "item",
                  in: {
                    $cond: [
                      { $eq: ["$$item.article", articleId] },
                      { article: "$$item.article", viewedAt: "$$NOW" },
                      "$$item"
                    ]
                  }
                }
              },
              {
                $concatArrays: [
                  { $ifNull: ["$readingHistory", []] },
                  [{ article: articleId, viewedAt: "$$NOW" }]
                ]
              }
            ]
          }
        }
      }
    ]
  );
}
