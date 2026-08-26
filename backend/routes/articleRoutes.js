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
    getTrendingArticles,
    getTrendingTags,
    getPersonalizedFeed,
    getExploreFeed,
    getExploreCategories
} from "../controllers/articleController.js";
import {protect, optionalAuth} from "../middlewares/authMiddleware.js";

const router = express.Router();

// --- Advanced Feed Routes ---
router.get("/popular", protect, getPopularArticles);
router.get("/trending", protect, getTrendingArticles);
router.get("/trending-tags", protect, getTrendingTags);
router.get("/feed/personalized", protect, getPersonalizedFeed);
router.get("/explore", optionalAuth, getExploreFeed);
router.get("/categories", getExploreCategories);

// /api/articles
router.get("/search", searchArticles);
router.get("/filter", filterArticlesByTag);

router.post("/", protect, upload.single("image"), createArticle);
router.get("/", getArticles);

router.put("/:id", protect, upload.single("image"), updateArticle);
router.delete("/:id", protect, deleteArticle);
router.put("/favorite/:id", protect, toggleFavorite);
router.post("/:id/comment", protect, addComment);
router.get("/feed", protect, getFeed);
router.get("/:id", optionalAuth, getArticleById);

export default router;