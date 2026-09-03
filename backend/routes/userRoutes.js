import express from "express";
import { protect, optionalAuth } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.js";
import { followUser } from "../controllers/userController.js";
import { searchUsers } from "../controllers/userController.js"
import { toggleLibrary, getLibrary } from "../controllers/userController.js"
import { updateLibraryVisibility, toggleFavoriteTag } from "../controllers/userController.js"
import { getMostReadTags } from "../controllers/userController.js";
import { getMe, setInterests } from "../controllers/userController.js";
import { getPublicProfile, updateProfile, getUserLibrary } from "../controllers/userController.js";
import { changePassword, deleteMyAccount } from "../controllers/userController.js";
import {
  updateProfileValidator,
  setInterestsValidator,
  changePasswordValidator,
  handleValidationErrors
} from "../middlewares/validators.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.put("/interests", protect, setInterestsValidator, handleValidationErrors, setInterests);
router.put("/profile", protect, upload.single("avatar"), updateProfileValidator, handleValidationErrors, updateProfile);
router.put("/change-password", protect, changePasswordValidator, handleValidationErrors, changePassword);
router.delete("/me", protect, deleteMyAccount);
router.put("/follow/:id", protect, followUser);
router.get("/search", searchUsers);
router.put("/library/visibility", protect, updateLibraryVisibility);
router.put("/library/:id", protect, toggleLibrary);
router.get("/library", protect, getLibrary);
router.put("/favorite-tag/:tagId", protect, toggleFavoriteTag);
router.get("/most-read-tags", protect, getMostReadTags);

// Tek parametreli catch-all route'lar en sona, sabit path'leri gölgelemesin diye
router.get("/:id/library", optionalAuth, getUserLibrary);
router.get("/:id", optionalAuth, getPublicProfile);

export default router;