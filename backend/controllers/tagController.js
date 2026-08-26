import Tag from "../models/Tag.js";
import asyncHandler from "../utils/asyncHandler.js";

// Tüm tag'leri listeleme (ilgi alanı seçim ekranı için)
export const getAllTags = asyncHandler(async (req, res) => {
    const tags = await Tag.find().sort({ name: 1 });
    res.json(tags);
});