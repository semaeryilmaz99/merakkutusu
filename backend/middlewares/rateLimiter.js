import rateLimit from "express-rate-limit";

// Genel API trafiği için
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin." }
});

// Brute-force riski taşıyan auth endpoint'leri için (login, register, forgot/reset-password, verify)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Çok fazla deneme yapıldı, lütfen 15 dakika sonra tekrar deneyin." }
});
