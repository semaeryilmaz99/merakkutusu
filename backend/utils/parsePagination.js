// İstek query'sinden page/limit okuyup güvenli sınırlar içinde normalize eder.
// Parametre verilmese bile bir üst sınır (defaultLimit) uygulanır — "hepsini getir"
// tarzı sınırsız sorguları önlemek için. maxLimit, kullanıcı çok yüksek bir limit
// isteseydi bile sunucuyu koruyan mutlak tavan.
export default function parsePagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
