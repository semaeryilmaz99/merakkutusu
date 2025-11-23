import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { followUser } from "../controllers/userController.js";
import { searchUsers } from "../controllers/userController.js"
import { toggleLibrary, getLibrary } from "../controllers/userController.js"
import { updateLibraryVisibility, toggleFavoriteTag } from "../controllers/userController.js"

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/follow/:id", protect, followUser);
router.get("/search", searchUsers);
router.put("/library/visibility", protect, updateLibraryVisibility); // kütüphane görünürlüğünü güncelle
router.put("/library/:id", protect, toggleLibrary);  // kütüphaneye ekle-çıkar
router.get("/library", protect, getLibrary); // kütüphaneyi listele
router.put("/favorite-tag/:tagId", protect, toggleFavoriteTag);

export default router;
