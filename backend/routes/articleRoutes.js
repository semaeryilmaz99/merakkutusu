import express from "express";
import upload from "../middlewares/upload.js";
import {
    createArticle, 
    getArticles, 
    getArticleById, 
    updateArticle, 
    deleteArticle
} from "../controllers/articleController.js";
import {protect} from "../middlewares/authMiddleware.js";

const router = express.Router();

// /api/articles
router.post("/", protect, upload.single("image"), createArticle);
router.get("/", getArticles);
router.get("/:id", getArticleById);
router.put("/:id", protect, updateArticle);
router.delete("/:id", protect, deleteArticle);

export default router;