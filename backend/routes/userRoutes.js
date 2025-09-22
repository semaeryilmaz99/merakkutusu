import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { followUser } from "../controllers/userController.js";
import { searchUsers } from "../controllers/userController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/follow/:id", protect, followUser);
router.get("/search", searchUsers);

export default router;
