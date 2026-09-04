import logger from "../config/logger.js";

// Tanımsız route'lar için 404 üretir, merkezi error handler'a devreder
export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
};

// Multer'ın kendi hata mesajları İngilizce geliyor (örn. "File too large") —
// kullanıcıya gösterilmeden önce Türkçeleştiriliyor.
const MULTER_ERROR_MESSAGES = {
  LIMIT_FILE_SIZE: "Dosya çok büyük (en fazla 5MB olabilir).",
  LIMIT_UNEXPECTED_FILE: "Beklenmeyen dosya alanı."
};

// Tüm route'lardan sonra mount edilen merkezi hata handler'ı
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.name === "MulterError" ? 400 : (res.statusCode === 200 ? 500 : res.statusCode);
  const message = err.name === "MulterError"
    ? (MULTER_ERROR_MESSAGES[err.code] || "Dosya yüklenemedi.")
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
