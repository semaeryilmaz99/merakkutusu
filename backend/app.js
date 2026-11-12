import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import logger from "./config/logger.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import articleRoutes from "./routes/articleRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import tagRoutes from "./routes/tagRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import { notFound, errorHandler } from "./middlewares/errorHandlerMiddleware.js";
import { generalLimiter } from "./middlewares/rateLimiter.js";
import allowedOrigins from "./config/allowedOrigins.js";

// Express app'in kurulumu — middleware'ler, route'lar, error handler. Burada
// hiçbir side effect yok (DB bağlantısı yok, port dinlemiyor) — bu yüzden
// testler bu dosyayı import edip supertest ile doğrudan çağırabiliyor,
// gerçek bir sunucu ayağa kalkmadan ve gerçek veritabanına dokunmadan.
const app = express();

// Render/Railway gibi platformlarda uygulama bir reverse proxy arkasında
// çalışıyor — bu ayar olmadan Express, req.ip'yi proxy'nin kendi iç adresi
// sanıyor ve rate limiter (aşağıda) TÜM kullanıcıları aynı kişi gibi
// sayıp paylaşımlı bir limite sokuyordu (bu yüzden tek bir kullanıcı birkaç
// kez giriş denediğinde bile "çok fazla istek" hatası alınabiliyordu).
// "1" değeri: sadece bir kademe proxy'ye (platformun kendi proxy'si) güven,
// X-Forwarded-For header'ının ilk değerini gerçek istemci IP'si olarak kullan.
app.set("trust proxy", 1);

// Standart güvenlik header'ları (X-Frame-Options, X-Content-Type-Options, HSTS vb.) —
// biz HTML değil sadece JSON döndüğümüz için varsayılan ayarları değiştirmeye gerek yok.
app.use(helmet());

// Sadece kendi frontend'imizden (ve yerel geliştirme sunucusundan) gelen
// isteklere izin veriyoruz — boş cors() "her yerden gelebilir" demekti, bu
// tarayıcı üzerinden başka bir siteden API'mize istek atılabilmesine izin veriyordu.
app.use(cors({
  origin: (origin, callback) => {
    // origin, tarayıcı dışı isteklerde (Postman, server-to-server) tanımsız gelir — izin ver
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error("CORS: Bu origin'e izin verilmiyor."));
  }
}));
// JSON response'ları (özellikle makale listeleri) gzip ile sıkıştırıp
// network üzerinden aktarılan boyutu küçültür — CPU maliyeti network
// kazancının çok altında, standart bir production pratiği.
app.use(compression());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP erişim logları (yöntem, url, status, süre) — morgan üretiyor, ama ayrı
// bir log sistemi olmasın diye winston'ın "http" seviyesinden akıtıyoruz.
app.use(morgan(
  process.env.NODE_ENV === "production" ? "combined" : "dev",
  { stream: { write: (message) => logger.http(message.trim()) } }
));

app.use("/api", generalLimiter);
app.use("/api/notifications", notificationRoutes);

//Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notes", noteRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
