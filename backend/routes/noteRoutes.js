import express from "express";
import { createNote, getMyNotes, getNoteById, deleteNote } from "../controllers/noteController.js";
import { protect } from "../middlewares/authMiddleware.js";
import uploadNote from "../middlewares/uploadNote.js";
import { aiLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// aiLimiter, multer'dan (uploadNote) ÖNCE çalışıyor — limiti aşmış bir
// istek, 15MB'lık dosyayı belleğe alıp işlemeye hiç başlamadan ucuza
// reddediliyor (limiter'ın asıl amacı budur; sırası ters olsaydı her
// reddedilen istek bile önce tüm dosya parse maliyetini ödemiş olurdu).
router.post("/", protect, aiLimiter, uploadNote.single("file"), createNote);
router.get("/", protect, getMyNotes);
router.get("/:id", protect, getNoteById);
router.delete("/:id", protect, deleteNote);

export default router;
