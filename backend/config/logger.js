import winston from "winston";

const isProduction = process.env.NODE_ENV === "production";

// Development'ta insan gözüyle okunacak tek satırlık renkli format,
// production'da bir log toplama servisinin (Render, Better Stack, Sentry vb.)
// doğrudan parse edebileceği JSON format.
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const logger = winston.createLogger({
  // "http" seviyesi error/warn/info/http'yi kapsar (debug hariç) — production'da
  // morgan'ın ürettiği HTTP erişim logları (http seviyesi) hâlâ görünsün diye
  // "info" değil "http" seçildi; "info" seçilseydi http seviyesindeki loglar
  // sessizce elenirdi (winston seviyeleri artan önem sırasına göre filtreler).
  level: isProduction ? "http" : "debug",
  format: isProduction ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" })
  ]
});

export default logger;
