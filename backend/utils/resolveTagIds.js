import Tag from "../models/Tag.js";

// Tag adlarından (virgülle ayrılmış string ya da dizi) ObjectId listesi
// üretir, olmayan tag'leri toplu oluşturur. createArticle/updateArticle
// aynı mantığı ayrı ayrı, tag başına bir Tag.findOne (N+1 sorgu) ile
// yazıyordu — burada tek bir toplu $in sorgusuna indirgendi. Ayrıca
// eşzamanlı iki istek aynı yeni tag'i oluşturmaya çalışırsa (unique index
// çakışması, E11000) artık yakalanmamış bir hatayla 500 dönmüyor.
export default async function resolveTagIds(rawTags) {
  let tagNames = [];
  if (Array.isArray(rawTags)) {
    tagNames = rawTags.map((t) => t.trim().toLowerCase());
  } else if (typeof rawTags === "string") {
    tagNames = rawTags.split(",").map((t) => t.trim().toLowerCase());
  }
  tagNames = [...new Set(tagNames.filter(Boolean))];
  if (tagNames.length === 0) return [];

  const existing = await Tag.find({ name: { $in: tagNames } });
  const existingNames = new Set(existing.map((t) => t.name));
  const missingNames = tagNames.filter((n) => !existingNames.has(n));

  let created = [];
  if (missingNames.length > 0) {
    try {
      created = await Tag.insertMany(
        missingNames.map((name) => ({ name })),
        { ordered: false }
      );
    } catch (err) {
      // Bazıları eşzamanlı bir istek tarafından az önce oluşturulmuş olabilir
      // — başarıyla eklenenler err.insertedDocs'ta gelir, kalanı aşağıda
      // tekrar sorgulayıp buluyoruz (kazanan isteğin oluşturduğu doküman).
      created = err.insertedDocs || [];
    }
  }

  const stillMissingNames = missingNames.filter(
    (n) => !created.some((c) => c.name === n)
  );
  const recheck =
    stillMissingNames.length > 0
      ? await Tag.find({ name: { $in: stillMissingNames } })
      : [];

  return [...existing, ...created, ...recheck].map((t) => t._id);
}
