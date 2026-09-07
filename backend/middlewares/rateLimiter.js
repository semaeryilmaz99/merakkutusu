import rateLimit from "express-rate-limit";

// Geliştirme ortamında (NODE_ENV production değilse) rate limit devre dışı —
// aksi halde manuel test sırasında (login/register tekrar tekrar denenirken)
// kendi IP'niz kilitlenir. Deploy ortamında NODE_ENV=production set edilmeli
// (Render/Railway/Heroku gibi platformlar bunu otomatik yapar).
const isDev = process.env.NODE_ENV !== "production";

// Genel API trafiği için
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
  message: { message: "Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin." }
});

// Brute-force riski taşıyan auth endpoint'leri için (login, register, forgot/reset-password, verify)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
  message: { message: "Çok fazla deneme yapıldı, lütfen 15 dakika sonra tekrar deneyin." }
});

// OpenAI çağrısı yapan (ücretli) endpoint'ler için — genel limitten daha sıkı,
// kötüye kullanım (ör. bir bot'un sürekli istek atması) doğrudan para kaybı demek.
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
  message: { message: "Çok fazla AI isteği gönderildi, lütfen 15 dakika sonra tekrar deneyin." }
});
