import "dotenv/config";
import express from "express";
import dotenv from "dotenv";
import http from "http";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cors from "cors";
import helmet from "helmet";
import articleRoutes from "./routes/articleRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import tagRoutes from "./routes/tagRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { notFound, errorHandler } from "./middlewares/errorHandlerMiddleware.js";
import { generalLimiter } from "./middlewares/rateLimiter.js";
import initChatSocket from "./socket/chatSocket.js";
import allowedOrigins from "./config/allowedOrigins.js";

dotenv.config();
connectDB();

const app = express();

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", generalLimiter);
app.use("/api/notifications", notificationRoutes);

//Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

const httpServer = http.createServer(app);
initChatSocket(httpServer);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server is running on port ${PORT}`));