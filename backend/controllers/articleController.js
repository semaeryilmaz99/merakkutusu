import Article from "../models/Article.js";

import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";

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

    const article = await Article.create({
      title,
      content,
      image: imageUrl,
      author: req.user._id
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
        res.status(500).json({message: error.message});
    }
};

// Tek makale getirme
export const getArticleById = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id).populate("author", "username email");
        if (!article) return res.status(404).json({message: "Makale bulunamadı."});
        res.json(article);
    } catch (err) {
        res.status(500).json({message: error.message});
    }
};

//Makale güncelleme
export const updateArticle = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) return res.status(404).json({message: "Makale bulunamadı."});
        if (article.author.toString() !== req.user._id.toString())
            return res.status(403).json({message: "Bu makaleyi güncelleme yetkiniz yok."});

        const {title, content, image} = req.body;
        article.title = title || article.title;
        article.content = content|| article.content;
        article.image = image || article.image;

        const updatedArticle = await article.save();
        res.json(updatedArticle);
    } catch (error) {
        res.status(500).json({message: error.message});
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