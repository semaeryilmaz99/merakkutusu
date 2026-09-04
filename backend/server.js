import "dotenv/config";
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import logger from "./config/logger.js";
import initChatSocket from "./socket/chatSocket.js";

connectDB();

// Kodun herhangi bir yerinde yakalanmamış bir promise reddi ya da senkron hata
// olursa Node'un varsayılan (belirsiz/sessiz) davranışına bırakmak yerine
// logluyoruz. uncaughtException'dan sonra süreç artık tutarsız bir durumda
// olabileceği için process'i kasıtlı olarak sonlandırıyoruz (Node'un önerdiği pattern) —
// unhandledRejection'da ise (genelde tek bir isteği etkiler) süreci ayakta tutuyoruz.
process.on("unhandledRejection", (reason) => {
  logger.error("Yakalanmamış promise reddi (unhandledRejection)", {
    message: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined
  });
});

process.on("uncaughtException", (err) => {
  logger.error("Yakalanmamış senkron hata (uncaughtException)", { message: err.message, stack: err.stack });
  // winston'ın dosya transport'u stream tabanlı/asenkron — process.exit() bekleyen
  // yazma işlemlerini beklemeden süreci anında sonlandırır, bu yüzden yukarıdaki
  // hata logs/error.log'a hiç yazılmadan kaybolabilir. Transport'ların "finish"
  // event'ini (tüm bekleyen yazmalar bitince tetiklenir) bekleyip öyle çıkıyoruz.
  logger.on("finish", () => process.exit(1));
  logger.end();
});

const httpServer = http.createServer(app);
initChatSocket(httpServer);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => logger.info(`Server is running on port ${PORT}`));
