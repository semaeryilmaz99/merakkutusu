import logger from "../config/logger.js";

// Tanımsız route'lar için 404 üretir, merkezi error handler'a devreder
export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
};

// Multer'ın kendi hata mesajları İngilizce geliyor (örn. "File too large") —
// kullanıcıya gösterilmeden önce Türkçeleştiriliyor. LIMIT_FILE_SIZE mesajı
// route'a göre değişiyor çünkü limit sabit değil: middlewares/upload.js
// (makale/avatar/chat görselleri) 5MB, middlewares/uploadNote.js (ders notu
// PDF/görsel) 15MB kullanıyor — sabit "5MB" mesajı Notlarım'da yanlış bilgi
// veriyordu (gerçek limit 15MB olduğu halde kullanıcıya 5MB deniyordu).
const getMulterErrorMessage = (code, req) => {
  if (code === "LIMIT_FILE_SIZE") {
    const maxMb = req.baseUrl.includes("/notes") ? 15 : 5;
    return `Dosya çok büyük (en fazla ${maxMb}MB olabilir).`;
  }
  if (code === "LIMIT_UNEXPECTED_FILE") return "Beklenmeyen dosya alanı.";
  return "Dosya yüklenemedi.";
};

// Tüm route'lardan sonra mount edilen merkezi hata handler'ı
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.name === "MulterError" ? 400 : (res.statusCode === 200 ? 500 : res.statusCode);
  const message = err.name === "MulterError"
    ? getMulterErrorMessage(err.code, req)
    : err.message;

  // Client'a giden mesaj kullanıcı dostu olabilir (ör. Türkçeleştirilmiş multer
  // hatası) ama sunucu tarafında her zaman orijinal hatayı ve stack'i logluyoruz —
  // aksi halde production'da (stack client'a gitmiyor) bir 500'ün hiçbir izi kalmaz.
  logger.error(err.message, {
    statusCode,
    method: req.method,
    url: req.originalUrl,
    stack: err.stack
  });

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
};
