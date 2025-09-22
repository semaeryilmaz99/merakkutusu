import User from "../models/User.js";
import Article from "../models/Article.js";
import Notification from "../models/Notification.js";

import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";

// Makale oluşturma
export const createArticle = async (req, res) => {
  try {
    const { title, content } = req.body;
    let imageUrl = "";

    if (req.file) {
      // Buffer’ı stream olarak Cloudinary’ye gönder
      const bufferStream = new Readable();
      bufferStream.push(req.file.buffer);
      bufferStream.push(null);

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "merakkutusu_articles" },
          (err, res) => {
            if (err) return reject(err);
            resolve(res);
          }
        );
        bufferStream.pipe(stream);
      });

      imageUrl = result.secure_url;
    }

    // tags gönderildiyse normalize et, yoksa boş array
    const tagsArray = Array.isArray(req.body.tags)
      ? req.body.tags.map(tag => tag.trim().toLowerCase())
      : [];

    const article = await Article.create({
      title,
      content,
      image: imageUrl,
      author: req.user._id,
      tags: tagsArray
    });

    res.status(201).json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

//Tüm makaleleri getirme
export const getArticles = async (req, res) => {
    try {
        const articles = await Article.find().populate("author", "username email");
        res.json(articles);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
};

// Tek makale getirme
export const getArticleById = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id).populate("author", "username email");
        if (!article) return res.status(404).json({message: "Makale bulunamadı."});
        res.json(article);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
};

//Makale güncelleme
export const updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Makale bulunamadı" });

    // -----------------------
    // Title ve Content
    // -----------------------
    article.title = req.body.title || article.title;
    article.content = req.body.content || article.content;

    // -----------------------
    // Tags (form-data string veya array)
    // -----------------------
    if (req.body.tags) {
      let tagsArray = [];
      if (Array.isArray(req.body.tags)) {
        tagsArray = req.body.tags.map(tag => tag.trim().toLowerCase());
      } else if (typeof req.body.tags === "string") {
        tagsArray = req.body.tags.split(",").map(tag => tag.trim().toLowerCase());
      }
      article.tags = tagsArray;
    }

    // -----------------------
    // Image (Cloudinary)
    // -----------------------
    if (req.file) {
      const bufferStream = new Readable();
      bufferStream.push(req.file.buffer);
      bufferStream.push(null);

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "merakkutusu_articles" },
          (err, res) => {
            if (err) return reject(err);
            resolve(res);
          }
        );
        bufferStream.pipe(stream);
      });

      article.image = result.secure_url;
    }

    await article.save();
    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Makale silme
export const deleteArticle = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) return res.status(404).json({message: "Makale bulunamadı."});
        if (article.author.toString() !== req.user._,deleteArticle.toString())
            return res.status(403).json({message: "Bu makaleyi silme yetkiniz yok."});

        await article.deleteOne();
        res.json({message: "Makale silindi."});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

// Favori ekle/çıkar
export const toggleFavorite = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Makale bulunamadı" });

    const userId = req.user._id;
    if (article.favorites.includes(userId)) {
      // Daha önce favori eklenmişse çıkar
      article.favorites.pull(userId);
    } else {
      // Favori ekle
      article.favorites.push(userId);

      if (article.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          user: article.author,
          type: "favorite",
          fromUser: req.user._id,
          article: article._id
        });
      }
    }

    await article.save();
    res.json({ favorites: article.favorites });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Yorum ekleme
export const addComment = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Makale bulunamadı" });

    const comment = {
      user: req.user._id,
      text: req.body.text
    };

    article.comments.push(comment);
    await article.save();

     // Bildirim oluştur (yorum yapan kişi makale sahibi değilse)
    if (article.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: article.author,
        type: "comment",
        fromUser: req.user._id,
        article: article._id
      });
    }

    res.status(201).json(article.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Feed oluşturma
export const getFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("following");
    const followingIds = user.following.map(f => f._id);

    const feed = await Article.find({ author: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .populate("author", "username email");

    res.json(feed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Article arama ve filtreleme
export const searchArticles = async (req, res) => {
  try {
    const { q, author, tags } = req.query;
    const filter = {};

    // Başlık veya içerikte arama (case-insensitive)
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } }
      ];
    }

    // Yazar ID’sine göre filtreleme
    if (author) {
      filter.author = author;
    }

    // Etiketlere göre filtreleme (trim + lowercase)
    if (tags) {
      const tagsArray = tags
        .split(",")
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0); // boş stringleri çıkar

      if (tagsArray.length > 0) {
        filter.tags = { $in: tagsArray };
      }
    }

    // Mongo sorgusu ve populate
    const articles = await Article.find(filter)
      .populate("author", "username email")
      .populate("comments.user", "username")
      .sort({ createdAt: -1 }); // en yeni makaleler üstte

    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};