import User from "../models/User.js";
import Article from "../models/Article.js";
import asyncHandler from "../utils/asyncHandler.js";
import parsePagination from "../utils/parsePagination.js";

// Tüm kullanıcıları sayfalı listeleme
export const getAllUsers = asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 25 });

    const [users, totalCount] = await Promise.all([
      User.find()
        .select("username email role isVerified createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments()
    ]);

    res.json({
      users,
      page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    });
});

// Bir kullanıcıyı silme
export const deleteUser = asyncHandler(async (req, res) => {
    const targetId = req.params.id;

    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ message: "Kendi hesabınızı bu şekilde silemezsiniz." });
    }

    const user = await User.findById(targetId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    await user.deleteOne();
    res.json({ message: "Kullanıcı silindi." });
});

// Bir kullanıcının aktivite özetini getirme
export const getUserActivity = asyncHandler(async (req, res) => {
    const targetId = req.params.id;

    const user = await User.findById(targetId).select("username email createdAt");
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    const articles = await Article.find({ author: targetId })
      .select("title createdAt favorites comments")
      .sort({ createdAt: -1 });

    const articleCount = articles.length;
    const receivedFavorites = articles.reduce((sum, a) => sum + a.favorites.length, 0);
    const receivedComments = articles.reduce((sum, a) => sum + a.comments.length, 0);

    // Bu kullanıcının başka makalelere yaptığı yorum sayısı
    const [{ madeComments } = { madeComments: 0 }] = await Article.aggregate([
      { $unwind: "$comments" },
      { $match: { "comments.user": user._id } },
      { $count: "madeComments" }
    ]);

    res.json({
      user: { _id: user._id, username: user.username, email: user.email, joinedAt: user.createdAt },
      articleCount,
      receivedFavorites,
      receivedComments,
      madeComments,
      recentArticles: articles.slice(0, 10).map(a => ({
        _id: a._id,
        title: a.title,
        createdAt: a.createdAt,
        favorites: a.favorites.length,
        comments: a.comments.length
      }))
    });
});