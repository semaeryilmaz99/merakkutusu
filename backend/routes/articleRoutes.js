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
    updateComment,
    deleteComment,
    searchArticles,
    filterArticlesByTag,
    getPopularArticles,
    getTrendingArticles,
    getTrendingTags,
    getPersonalizedFeed,
    getExploreFeed,
    getExploreCategories,
    getArticlesByAuthor
} from "../controllers/articleController.js";
import {protect, optionalAuth} from "../middlewares/authMiddleware.js";
import { createArticleValidator, addCommentValidator, handleValidationErrors } from "../middlewares/validators.js";

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
router.get("/author/:id", getArticlesByAuthor);

router.post("/", protect, upload.single("image"), createArticleValidator, handleValidationErrors, createArticle);
router.get("/", getArticles);

router.put("/:id", protect, upload.single("image"), updateArticle);
router.delete("/:id", protect, deleteArticle);
router.put("/favorite/:id", protect, toggleFavorite);
router.post("/:id/comment", protect, addCommentValidator, handleValidationErrors, addComment);
router.put("/:id/comment/:commentId", protect, addCommentValidator, handleValidationErrors, updateComment);
router.delete("/:id/comment/:commentId", protect, deleteComment);
router.get("/feed", protect, getFeed);
router.get("/:id", optionalAuth, getArticleById);

export default router;