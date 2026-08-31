import express from "express";
import { protect, requireAdmin } from "../middlewares/authMiddleware.js";
import { getAllUsers, deleteUser, getUserActivity } from "../controllers/adminController.js";

const router = express.Router();

router.get("/users", protect, requireAdmin, getAllUsers);
router.delete("/users/:id", protect, requireAdmin, deleteUser);
router.get("/users/:id/activity", protect, requireAdmin, getUserActivity);

export default router;