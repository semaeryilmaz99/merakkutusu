import express from "express";
import { createNote, getMyNotes, getNoteById, deleteNote } from "../controllers/noteController.js";
import { protect } from "../middlewares/authMiddleware.js";
import uploadNote from "../middlewares/uploadNote.js";
import { aiLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/", protect, uploadNote.single("file"), aiLimiter, createNote);
router.get("/", protect, getMyNotes);
router.get("/:id", protect, getNoteById);
router.delete("/:id", protect, deleteNote);

export default router;
