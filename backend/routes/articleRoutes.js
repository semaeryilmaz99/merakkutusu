import express from "express";
import upload from "../middlewares/upload.js";

import {
    createArticle, 
    getArticles,
    getFeed, 
    getArticleById, 
    updateArticle, 
    deleteArticle,
    toggleFavorite,
    addComment,
    searchArticles,
    filterArticlesByTag
} from "../controllers/articleController.js";
import {protect} from "../middlewares/authMiddleware.js";

const router = express.Router();

// /api/articles
router.get("/search", searchArticles);
router.get("/filter", filterArticlesByTag);

router.post("/", protect, upload.single("image"), createArticle);
router.get("/", getArticles);

router.put("/:id", protect, updateArticle);
router.delete("/:id", protect, deleteArticle);
router.put("/favorite/:id", protect, toggleFavorite);
router.post("/:id/comment", protect, addComment);
router.get("/feed", protect, getFeed);
router.get("/:id", getArticleById);

export default router;