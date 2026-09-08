const EXCERPT_LENGTH = 300;
const WORDS_PER_MINUTE = 200; // frontend/src/utils/readingTime.js ile aynı formül

// Liste/feed görünümleri (ArticleCard) tam makale gövdesini göstermiyor,
// sadece kısa bir özet — ama şimdiye kadar backend her makalenin TÜM
// markdown içeriğini (bazıları birkaç KB) network üzerinden yolluyordu.
// Bu, makale objesindeki ağır `content` alanını çıkarıp yerine kısa bir
// `excerpt` ve sunucu tarafında hesaplanmış `readingMinutes` koyar — tam
// içerik sadece tek makale görüntülemede (getArticleById) kalıyor.
export default function toArticleSummary(article) {
  const content = article.content || "";
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
  const excerpt = content.slice(0, EXCERPT_LENGTH);

  const { content: _omit, ...rest } = article;
  return { ...rest, excerpt, readingMinutes };
}
