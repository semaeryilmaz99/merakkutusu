import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Article from "../models/Article.js";
import Tag from "../models/Tag.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";
import { getIo } from "../socket/chatSocket.js";

export const followUser = asyncHandler(async (req, res) => {
      const userId = req.user._id;       // Takip eden
      const targetId = req.params.id;    // Takip edilecek kişi

    if (userId.toString() === targetId) {
        return res.status(400).json({ message: "Kendinizi takip edemezsiniz" });
    }

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetId);

    if (!targetUser) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

      // Zaten takip ediyorsa bırak
    if (user.following.includes(targetId)) {
        user.following.pull(targetId);
        targetUser.followers.pull(userId);
        await user.save();
        await targetUser.save();
        return res.json({ message: "Takipten çıkarıldı" });
    }

      // Takip et
    user.following.push(targetId);
    targetUser.followers.push(userId);
    await user.save();
    await targetUser.save();

    // Takip bildirimi oluştur
    await Notification.create({
    user: targetId, // Takip edilen kişi
    type: "follow",
    fromUser: userId
});
    getIo()?.to(`user:${targetId}`).emit("notification:new");

    res.json({ message: "Takip edildi" });
});

// Kullanıcı arama
export const searchUsers = asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Arama terimi gerekli" });

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { bio: { $regex: q, $options: "i" } }
      ]
    }).select("username bio");

    res.json(users);
});

// Kütüphaneye makale ekleme
export const toggleLibrary = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    const articleId = req.params.id;

    // Daha önce eklediyse çıkar
    if (user.library.includes(articleId)) {
      user.library = user.library.filter(a => a.toString() !== articleId);
      await user.save();
      return res.json({ message: "Makale kütüphaneden çıkarıldı" });
    }

    // Yoksa ekle
    user.library.push(articleId);
    await user.save();
    res.json({ message: "Makale kütüphaneye eklendi" });
});

// Kullanıcının kütüphanesini getirme
export const getLibrary = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
      .populate({
        path: "library",
        select: "title content author image createdAt",
        populate: { path: "author", select: "username avatar" }
      });

    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    res.json(user.library);
});

// Kullanıcının kütüphane görünürlüğünü değiştirme
export const updateLibraryVisibility = asyncHandler(async (req, res) => {
    const {visibility} = req.body;

    if (!["public", "private"].includes(visibility)) {
      return res.status(400).json({message: "Geçersiz gizlilik değeri. 'public' veya 'private' olmalı"});
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {libraryVisibility: visibility},
      {new: true}
    );

    res.status(200).json({
      message: `Kütüphane gizliliği '${user.libraryVisibility}' olarak ayarlandı.`,
      librarysVisibility: user.libraryVisibility
    });
});

// Kullanıcının favori taglerini ekleme, çıkarma

export const toggleFavoriteTag = asyncHandler(async (req, res) => {
    const tagId = req.params.tagId;

    if (!mongoose.Types.ObjectId.isValid(tagId)) {
      return res.status(400).json({ message: "Geçersiz tag ID" });
    }
    const tagExists = await Tag.exists({ _id: tagId });
    if (!tagExists) {
      return res.status(404).json({ message: "Tag bulunamadı" });
    }

    const user = await User.findById(req.user._id);

    const index = user.favoriteTags.indexOf(tagId);

    if (index === -1) {
      user.favoriteTags.push(tagId);
    } else {
      user.favoriteTags.splice(index, 1);
    }

    await user.save();

    res.json({
      message: "Favorite tags updated",
      favoriteTags: user.favoriteTags,
    });
});

// Kullanıcının en çok okuduğu tagleri getirme (tag isimleriyle birlikte)
export const getMostReadTags = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate({
      path: "readingHistory.article",
      populate: { path: "tags", select: "name" }
    });

    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    const tagCount = {};

    // Okunan makaleleri ve taglerini say
    user.readingHistory.forEach(item => {
      item.article.tags.forEach(tag => {
        if (tagCount[tag._id]) {
          tagCount[tag._id].count += 1;
        } else {
          tagCount[tag._id] = { name: tag.name, count: 1 };
        }
      });
    });

    // Sıralama ve top tagleri alma
    const sortedTags = Object.entries(tagCount)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([tagId, info]) => ({
        tagId,
        name: info.name,
        count: info.count
      }));

    res.json({ mostReadTags: sortedTags });
});

// Kendi profilini getirme
export const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
      .select("-password -verificationToken -resetPasswordToken -resetPasswordExpires")
      .populate("favoriteTags", "name")
      .populate("following", "username avatar")
      .populate("followers", "username avatar");

    const [articlesCount, favoritesCount] = await Promise.all([
      Article.countDocuments({ author: req.user._id }),
      Article.countDocuments({ favorites: req.user._id })
    ]);

    res.json({ ...user.toObject(), articlesCount, favoritesCount });
});

// İlgi alanlarını toplu ayarlama (mevcut favoriteTags setini komple değiştirir)
export const setInterests = asyncHandler(async (req, res) => {
    const { tagIds } = req.body;

    if (!Array.isArray(tagIds)) {
      return res.status(400).json({ message: "tagIds bir dizi olmalı" });
    }

    const validIds = tagIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    const existingTags = await Tag.find({ _id: { $in: validIds } }).select("_id");
    const existingIds = existingTags.map(t => t._id);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { favoriteTags: existingIds },
      { new: true }
    ).populate("favoriteTags", "name");

    res.json({ message: "İlgi alanları güncellendi", favoriteTags: user.favoriteTags });
});

// Başka bir kullanıcının herkese açık profilini getirme
export const getPublicProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
      .select("username bio avatar followers following createdAt");

    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    const [articlesCount, favoritesCount] = await Promise.all([
      Article.countDocuments({ author: user._id }),
      Article.countDocuments({ favorites: user._id })
    ]);

    const profile = {
      _id: user._id,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      articlesCount,
      favoritesCount,
      createdAt: user.createdAt
    };

    if (req.user) {
      profile.isFollowing = user.followers.some(id => id.toString() === req.user._id.toString());
    }

    res.json(profile);
});

// Kendi profilini güncelleme (bio ve/veya avatar)
export const updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    if (req.body.bio !== undefined) {
      user.bio = req.body.bio;
    }

    if (req.file) {
      const bufferStream = new Readable();
      bufferStream.push(req.file.buffer);
      bufferStream.push(null);

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "merakkutusu_avatars", quality: "auto", fetch_format: "auto" },
          (err, res) => {
            if (err) return reject(err);
            resolve(res);
          }
        );
        bufferStream.pipe(stream);
      });

      user.avatar = result.secure_url;
    }

    await user.save();

    res.json({ message: "Profil güncellendi", bio: user.bio, avatar: user.avatar });
});

// Başka bir kullanıcının kütüphanesini görüntüleme (görünürlük kontrolüyle)
export const getUserLibrary = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
      .populate({
        path: "library",
        select: "title content author image createdAt",
        populate: { path: "author", select: "username avatar" }
      });

    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    const isOwner = req.user && req.user._id.toString() === user._id.toString();

    if (user.libraryVisibility !== "public" && !isOwner) {
      return res.status(403).json({ message: "Bu kütüphane gizli" });
    }

    res.json(user.library);
});
