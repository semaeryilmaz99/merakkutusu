// Tanımsız route'lar için 404 üretir, merkezi error handler'a devreder
export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
};

// Tüm route'lardan sonra mount edilen merkezi hata handler'ı
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
};
