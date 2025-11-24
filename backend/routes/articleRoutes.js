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
    filterArticlesByTag,
    getPopularArticles,
    getTrendingTags,
    getPersonalizedFeed
} from "../controllers/articleController.js";
import {protect} from "../middlewares/authMiddleware.js";

const router = express.Router();

// --- Advanced Feed Routes ---
router.get("/popular", protect, getPopularArticles);
router.get("/trending-tags", protect, getTrendingTags);
router.get("/feed", protect, getPersonalizedFeed);

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
router.get("/:id", protect, getArticleById);

export default router;