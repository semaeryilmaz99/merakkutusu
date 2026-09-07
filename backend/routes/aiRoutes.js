import express from "express";
import { suggestSources } from "../controllers/aiController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { aiLimiter } from "../middlewares/rateLimiter.js";
import { suggestSourcesValidator, handleValidationErrors } from "../middlewares/validators.js";

const router = express.Router();

router.post("/suggest-sources", protect, aiLimiter, suggestSourcesValidator, handleValidationErrors, suggestSources);

export default router;
