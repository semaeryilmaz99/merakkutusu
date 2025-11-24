import User from "../models/User.js";
import Article from "../models/Article.js";
import Tag from "../models/Tag.js";
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
    let tagsArray = [];
    if (req.body.tags) {
    if (Array.isArray(req.body.tags)) {
    tagsArray = req.body.tags.map(tag => tag.trim().toLowerCase());
    } else if (typeof req.body.tags === "string") {
    tagsArray = req.body.tags.split(",").map(tag => tag.trim().toLowerCase());
   }
}

// Otomatik tag oluşturma ve ID'ye çevirme
const tagIds = [];

for (const tagName of tagsArray) {
  let tag = await Tag.findOne({ name: tagName });

  if (!tag) {
    tag = await Tag.create({ name: tagName });
  }

  tagIds.push(tag._id);
}

    const article = await Article.create({
      title,
      content,
      image: imageUrl,
      author: req.user._id,
      tags: tagIds
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
        const article = await Article.findById(req.params.id)
        .populate("author", "username email")
        .populate("tags", "name");

        if (!article) return res.status(404).json({message: "Makale bulunamadı."});

           if (req.user) {
            // Eğer makale daha önce eklenmişse viewedAt'ı güncelle, yoksa ekle
            await User.updateOne(
                { _id: req.user._id, "readingHistory.article": article._id },
                { $set: { "readingHistory.$.viewedAt": new Date() } }
            );

            // Eğer makale yoksa push ile ekle
            await User.updateOne(
                { _id: req.user._id, "readingHistory.article": { $ne: article._id } },
                { $push: { readingHistory: { article: article._id, viewedAt: new Date() } } }
            );
        }
        
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

// Makaleleri tag'e göre filtreleme
export const filterArticlesByTag = async (req, res) => {
  try {
    const {tag} = req.query;
    if (!tag) {
      return res.status(400).json({message: "Filtreleme için bir tag gereklidir."})
    }

    // Makaleleri ilgili tag'e göre getir
    const articles = await Article.find({tags: { $in: [tag]}})
    .populate("author", "username email")
    .sort({createdAt: -1}); //en yeni makaleler üstte

    res.json(articles);
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

// Popüler makaleleri getirme
export const getPopularArticles = async (req, res) => {
  try {
    const articles = await Article.find()
      .populate("author", "username email")
      .populate("tags", "name")
      .lean();

    const sorted = articles
      .map(a => ({ ...a, popularity: a.favorites.length * 2 + a.comments.length }))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10);

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Trending tags
export const getTrendingTags = async (req, res) => {
  try {
    const tags = await Tag.aggregate([
      { 
        $lookup: {
          from: "articles",
          localField: "_id",
          foreignField: "tags",
          as: "articles"
        }
       },
       {
        $project: {
          name: 1,
          count: { $size: "$articles" }
        }
       },
       { $sort: { count: -1 }},
       { $limit: 10 }
    ]);

    res.json(tags);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Personalized feed
export const getPersonalizedFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("following")
      .populate("favoriteTags")
      .populate({
        path: "readingHistory.article",
        populate: { path: "tags", select: "name" }
      });

    const followingIds = user.following.map(f => f._id);
    const favoriteTagIds = user.favoriteTags.map(t => t._id.toString());

    // 1) Takip edilen kullanıcıların makaleleri
    const followingArticles = await Article.find({
      author: { $in: followingIds }
    })
      .populate("author", "username")
      .populate("tags", "name")
      .lean();

    // 2) Kullanıcının favori taglerine göre makaleler
    const tagArticles = await Article.find({
      tags: { $in: favoriteTagIds }
    })
      .populate("author", "username")
      .populate("tags", "name")
      .lean();

    // 3) Kullanıcının okuma geçmişinden en çok okunan tagleri belirle
    const tagCount = {};
    user.readingHistory.forEach(item => {
      if (item.article && item.article.tags) {
        item.article.tags.forEach(tag => {
          const tagId = tag._id.toString();
          tagCount[tagId] = (tagCount[tagId] || 0) + 1;
        });
      }
    });

    const mostReadTagIds = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .map(([tagId]) => tagId);

    // 4) En çok okunan taglere ait makaleler
    const mostReadTagArticles = await Article.find({
      tags: { $in: mostReadTagIds }
    })
      .populate("author", "username")
      .populate("tags", "name")
      .lean();

    // 5) Tüm makaleleri birleştir ve tekrarları kaldır
    const merged = [...followingArticles, ...tagArticles, ...mostReadTagArticles];
    const uniqueArticles = Array.from(new Set(merged.map(a => a._id.toString()))).map(id =>
      merged.find(a => a._id.toString() === id)
    );

    // 6) Sıralama: favori tag ve okunan tag ağırlığı + popülerlik
    const sorted = uniqueArticles.sort((a, b) => {
      const aScore =
        a.tags.filter(tag => favoriteTagIds.includes(tag._id.toString())).length * 2 +
        a.tags.filter(tag => mostReadTagIds.includes(tag._id.toString())).length +
        a.favorites.length * 2 + a.comments.length;
      const bScore =
        b.tags.filter(tag => favoriteTagIds.includes(tag._id.toString())).length * 2 +
        b.tags.filter(tag => mostReadTagIds.includes(tag._id.toString())).length +
        b.favorites.length * 2 + b.comments.length;
      return bScore - aScore;
    });

    res.json(sorted);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// Tagleri favoriye ekleme
export const toggleFavoriteTag = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const tagId = req.params.tagId;

    if (!mongoose.Types.ObjectId.isValid(tagId)) {
      return res.status(400).json({ message: "Invalid tag ID" });
    }

    const existingIndex = user.favoriteTags.indexOf(tagId);

    if (existingIndex === -1) {
      user.favoriteTags.push(tagId);
    } else {
      user.favoriteTags.splice(existingIndex, 1);
    }

    await user.save();

    res.json({
      message: "Favorite tags updated",
      favoriteTags: user.favoriteTags,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
