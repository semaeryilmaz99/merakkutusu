import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { followUser } from "../controllers/userController.js";
import { searchUsers } from "../controllers/userController.js"
import { toggleLibrary, getLibrary } from "../controllers/userController.js"
import { updateLibraryVisibility, toggleFavoriteTag } from "../controllers/userController.js"
import { getMostReadTags } from "../controllers/userController.js";
import { getMe, setInterests } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.put("/interests", protect, setInterests);
router.put("/follow/:id", protect, followUser);
router.get("/search", searchUsers);
router.put("/library/visibility", protect, updateLibraryVisibility);
router.put("/library/:id", protect, toggleLibrary);
router.get("/library", protect, getLibrary);
router.put("/favorite-tag/:tagId", protect, toggleFavoriteTag);
router.get("/most-read-tags", protect, getMostReadTags);

export default router;
