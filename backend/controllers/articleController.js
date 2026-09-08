import User from "../models/User.js";
import Article from "../models/Article.js";
import Tag from "../models/Tag.js";
import Notification from "../models/Notification.js";
import calculateTagWeights from "../utils/calculateTagWeights.js";
import calculateFeedScore from "../utils/calculateFeedScore.js";
import calculateTrendingScore from "../utils/calculateTrendingScore.js";
import shuffleArray from "../utils/shuffleArray.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

import { getIo } from "../socket/chatSocket.js";
import parsePagination from "../utils/parsePagination.js";
import toArticleSummary from "../utils/toArticleSummary.js";
import escapeRegExp from "../utils/escapeRegExp.js";
import recordArticleView from "../utils/recordArticleView.js";
import resolveTagIds from "../utils/resolveTagIds.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

// Makale oluşturma
export const createArticle = asyncHandler(async (req, res) => {
    const { title, content } = req.body;
    let imageUrl = "";

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: "merakkutusu_articles",
        quality: "auto",
        fetch_format: "auto"
      });
      imageUrl = result.secure_url;
    }

    const tagIds = await resolveTagIds(req.body.tags);

    const article = await Article.create({
      title,
      content,
      image: imageUrl,
      author: req.user._id,
      tags: tagIds
    });

    res.status(201).json(article);
});

//Tüm makaleleri getirme
export const getArticles = asyncHandler(async (req, res) => {
    const { skip, limit } = parsePagination(req.query);
    const articles = await Article.find()
      .populate("author", "username email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    res.json(articles.map(toArticleSummary));
});

// Tek makale getirme
export const getArticleById = asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id)
    .populate("author", "username email avatar")
    .populate("tags", "name")
    .populate("comments.user", "username");

    if (!article) return res.status(404).json({message: "Makale bulunamadı."});

    // Görüntülenme sayacı (anonim dahil, her görüntülemede atomik artar)
    await Article.updateOne({ _id: article._id }, { $inc: { views: 1 } });
    article.views = (article.views || 0) + 1;

       if (req.user) {
        await recordArticleView(req.user._id, article._id);
    }

    res.json(article);
});

//Makale güncelleme
export const updateArticle = asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Makale bulunamadı" });

    if (article.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bu makaleyi düzenleme yetkiniz yok." });
    }

    // -----------------------
    // Title ve Content
    // -----------------------
    article.title = req.body.title || article.title;
    article.content = req.body.content || article.content;

    // Tags (form-data string veya array) — resolveTagIds isimden ObjectId'ye
    // çevirir, olmayan tag'leri otomatik oluşturur (createArticle ile aynı mantık)
    if (req.body.tags) {
      article.tags = await resolveTagIds(req.body.tags);
    }

    // Image (Cloudinary)
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: "merakkutusu_articles",
        quality: "auto",
        fetch_format: "auto"
      });
      article.image = result.secure_url;
    }

    await article.save();
    await article.populate([
      { path: "author", select: "username email avatar" },
      { path: "tags", select: "name" },
      { path: "comments.user", select: "username" }
    ]);
    res.json(article);
});

// Makale silme
export const deleteArticle = asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id);

    if (!article) return res.status(404).json({message: "Makale bulunamadı."});
    if (article.author.toString() !== req.user._id.toString() && req.user.role !== "admin")
        return res.status(403).json({message: "Bu makaleyi silme yetkiniz yok."});

    await article.deleteOne();
    res.json({message: "Makale silindi."});
});

// Favori ekle/çıkar
export const toggleFavorite = asyncHandler(async (req, res) => {
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
        getIo()?.to(`user:${article.author}`).emit("notification:new");
      }
    }

    await article.save();
    res.json({ favorites: article.favorites });
});

// Yorum ekleme
export const addComment = asyncHandler(async (req, res) => {
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
      getIo()?.to(`user:${article.author}`).emit("notification:new");
    }

    await article.populate("comments.user", "username");
    res.status(201).json(article.comments);
});

// Yorum düzenleme (sadece yorumu yazan kişi)
export const updateComment = asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Makale bulunamadı" });

    const comment = article.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Yorum bulunamadı" });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Bu yorumu düzenleme yetkiniz yok." });
    }

    comment.text = req.body.text;
    await article.save();
    await article.populate("comments.user", "username");

    res.json(article.comments);
});

// Yorum silme (yorumu yazan kişi, makale sahibi veya admin)
export const deleteComment = asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Makale bulunamadı" });

    const comment = article.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Yorum bulunamadı" });

    const isCommentOwner = comment.user.toString() === req.user._id.toString();
    const isArticleOwner = article.author.toString() === req.user._id.toString();
    if (!isCommentOwner && !isArticleOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bu yorumu silme yetkiniz yok." });
    }

    comment.deleteOne();
    await article.save();
    await article.populate("comments.user", "username");

    res.json(article.comments);
});

// Feed oluşturma
export const getFeed = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate("following");
    const followingIds = user.following.map(f => f._id);

    const feed = await Article.find({ author: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .populate("author", "username email avatar");

    res.json(feed);
});

// Article arama ve filtreleme
export const searchArticles = asyncHandler(async (req, res) => {
    const { q, author, tags } = req.query;
    const filter = {};

    // Başlık veya içerikte arama (case-insensitive) — regex özel karakterleri
    // kaçışlanmıyorsa (ör. "[" tek başına) MongoDB regex derlemesi çöküp
    // yakalanmamış bir 500 hatası veriyordu.
    if (q) {
      const safeQuery = escapeRegExp(q);
      filter.$or = [
        { title: { $regex: safeQuery, $options: "i" } },
        { content: { $regex: safeQuery, $options: "i" } }
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
        // Article.tags alanı Tag ObjectId'leri tuttuğu için önce isimleri ID'ye çeviriyoruz
        const matchedTags = await Tag.find({ name: { $in: tagsArray } }).select("_id");
        filter.tags = { $in: matchedTags.map(t => t._id) };
      }
    }

    // Mongo sorgusu ve populate
    const { skip, limit } = parsePagination(req.query);
    const articles = await Article.find(filter)
      .populate("author", "username email avatar")
      .populate("comments.user", "username")
      .populate("tags", "name")
      .sort({ createdAt: -1 }) // en yeni makaleler üstte
      .skip(skip)
      .limit(limit)
      .lean();

    res.json(articles.map(toArticleSummary));
});

// Makaleleri tag'e göre filtreleme
export const filterArticlesByTag = asyncHandler(async (req, res) => {
    const {tag} = req.query;
    if (!tag) {
      return res.status(400).json({message: "Filtreleme için bir tag gereklidir."})
    }

    // tag ismini Tag ObjectId'sine çevir (Article.tags alanı ID tutar, isim değil)
    const { skip, limit } = parsePagination(req.query);
    const matchedTag = await Tag.findOne({ name: tag.trim().toLowerCase() });
    const articles = matchedTag
      ? await Article.find({tags: { $in: [matchedTag._id]}})
          .populate("author", "username email avatar")
          .populate("tags", "name")
          .sort({createdAt: -1}) //en yeni makaleler üstte
          .skip(skip)
          .limit(limit)
          .lean()
      : [];

    res.json(articles.map(toArticleSummary));
});

// Popüler makaleleri getirme
export const getPopularArticles = asyncHandler(async (req, res) => {
    const articles = await Article.find()
      .populate("author", "username email avatar")
      .populate("tags", "name")
      .lean();

    const sorted = articles
      .map(a => ({ ...a, popularity: a.favorites.length * 2 + a.comments.length }))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10);

    res.json(sorted.map(toArticleSummary));
});

// Trend olan makaleler (zaman-ağırlıklı hot skoru — /popular'dan farklı olarak
// güncel etkileşimi önceler, tüm-zamanların-en-iyisi değil "şu an yükselenler")
export const getTrendingArticles = asyncHandler(async (req, res) => {
    const articles = await Article.find()
      .populate("author", "username email avatar")
      .populate("tags", "name")
      .lean();

    const sorted = articles
      .map(a => ({ ...a, trendingScore: calculateTrendingScore(a) }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 10);

    res.json(sorted.map(toArticleSummary));
});

// Trending tags
export const getTrendingTags = asyncHandler(async (req, res) => {
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
});

// Personalized feed
export const getPersonalizedFeed = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
      .populate("following")
      .populate("favoriteTags")
      .populate({
        path: "readingHistory.article",
        populate: { path: "tags", select: "name" }
      });

    if (!user) return res.status(404).json({ message: "User not found" });

    const followingIds = user.following.map(f => f._id);
    let favoriteTagIds = user.favoriteTags.map(t => t._id.toString());
    favoriteTagIds = favoriteTagIds.filter(id => mongoose.Types.ObjectId.isValid(id));

    // Her havuz kendi içinde en yeni 100 makaleyle sınırlanıyor — kullanıcı çok
    // sayıda kişi takip ediyorsa/çok ilgi alanı seçmişse bile bellekte puanlanacak
    // aday sayısı sınırsız büyümesin diye.
    const POOL_LIMIT = 100;

    // 1) ve 2): Takip edilen kullanıcıların makaleleri + favori tag'lere göre
    // makaleler — birbirinden bağımsız iki sorgu, art arda değil paralel
    // çalıştırılıyor (Atlas'a her round-trip gerçek gecikme ekliyor).
    const [followingArticles, tagArticles] = await Promise.all([
      Article.find({ author: { $in: followingIds } })
        .populate("author", "username avatar")
        .populate("tags", "name")
        .sort({ createdAt: -1 })
        .limit(POOL_LIMIT)
        .lean(),
      Article.find({ tags: { $in: favoriteTagIds } })
        .populate("author", "username avatar")
        .populate("tags", "name")
        .sort({ createdAt: -1 })
        .limit(POOL_LIMIT)
        .lean()
    ]);

    // 3) Kullanıcının okuma geçmişinden tag başına okuma sayısını çıkar,
    //    sonra bu sayımlardan tag ağırlıklarını hesapla
    const tagReadCounts = {};
    user.readingHistory.forEach(item => {
      if (!item.article || !item.article.tags) return;
      item.article.tags.forEach(tag => {
        const tagId = tag._id.toString();
        tagReadCounts[tagId] = (tagReadCounts[tagId] || 0) + 1;
      });
    });
    const tagWeights = calculateTagWeights(tagReadCounts);

    // 4) En çok okunan taglere ait makaleler
    let mostReadTagIds = Object.keys(tagWeights);
    mostReadTagIds = mostReadTagIds.filter(id => mongoose.Types.ObjectId.isValid(id));

    const mostReadTagArticles = await Article.find({
      tags: { $in: mostReadTagIds }
    })
      .populate("author", "username avatar")
      .populate("tags", "name")
      .sort({ createdAt: -1 })
      .limit(POOL_LIMIT)
      .lean();

    // 5) Tüm makaleleri birleştir
    const merged = [
      ...followingArticles,
      ...tagArticles,
      ...mostReadTagArticles
    ];

    const uniqueArticles = Array.from(
      new Set(merged.map(a => a._id.toString()))
    ).map(id => merged.find(a => a._id.toString() === id));

    // 6) Her makale için score hesapla (tagWeight + popularity + recency)
    const scoredArticles = uniqueArticles.map(article => {
      const score = calculateFeedScore(article, tagWeights, favoriteTagIds);
      return { ...article, score };
    });

    // 7) Score’a göre sırala
    scoredArticles.sort((a, b) => b.score - a.score);

    const { skip, limit } = parsePagination(req.query, { defaultLimit: 30 });
    res.json(scoredArticles.slice(skip, skip + limit).map(toArticleSummary));
});

// Explore feed: trend + random + ilgi alanı harmanı
export const getExploreFeed = asyncHandler(async (req, res) => {
    // 1) Trend havuzu — tüm koleksiyonu değil, en yeni 150 makaleyi çekip
    // aralarından skorluyoruz (trend skoru zaten zaman-ağırzırlıklı olduğu
    // için eski makaleler pratikte hiç ilk 8'e giremiyor, bu limit sonucu
    // değiştirmiyor ama koleksiyon büyüdükçe tüm tabloyu taramayı önlüyor).
    const RECENT_POOL_LIMIT = 150;
    const recentArticles = await Article.find()
      .populate("author", "username email avatar")
      .populate("tags", "name")
      .sort({ createdAt: -1 })
      .limit(RECENT_POOL_LIMIT)
      .lean();
    const trendingPool = [...recentArticles]
      .sort((a, b) => calculateTrendingScore(b) - calculateTrendingScore(a))
      .slice(0, 8);

    // 2) Rastgele havuz
    const randomDocs = await Article.aggregate([{ $sample: { size: 8 } }]);
    const randomPool = await Article.populate(randomDocs, [
      { path: "author", select: "username email" },
      { path: "tags", select: "name" }
    ]);

    // 3) İlgi alanı havuzu (login'se ve favoriteTags varsa)
    let interestPool = [];
    if (req.user) {
      const user = await User.findById(req.user._id).select("favoriteTags");
      if (user?.favoriteTags?.length) {
        interestPool = await Article.find({ tags: { $in: user.favoriteTags } })
          .populate("author", "username email avatar")
          .populate("tags", "name")
          .limit(8)
          .lean();
      }
    }

    // 4) Havuzları birleştir, tekilleştir, karıştır
    const merged = [...trendingPool, ...randomPool, ...interestPool];
    const uniqueArticles = Array.from(
      new Map(merged.map(a => [a._id.toString(), a])).values()
    );

    res.json(shuffleArray(uniqueArticles).slice(0, 20).map(toArticleSummary));
});

// Keşfet: taglere göre gruplanmış kategori önizlemeleri
export const getExploreCategories = asyncHandler(async (req, res) => {
    const tags = await Tag.find().sort({ name: 1 });

    const categories = await Promise.all(
      tags.map(async (tag) => {
        const [articles, articleCount] = await Promise.all([
          Article.find({ tags: tag._id })
            .populate("author", "username avatar")
            .populate("tags", "name")
            .sort({ createdAt: -1 })
            .limit(6)
            .lean(),
          Article.countDocuments({ tags: tag._id })
        ]);
        return { tag: { _id: tag._id, name: tag.name }, articleCount, articles: articles.map(toArticleSummary) };
      })
    );

    res.json(categories.filter(c => c.articleCount > 0));
});

// Belirli bir yazarın makaleleri (profil sayfaları için — hem kendi hem başkasının)
export const getArticlesByAuthor = asyncHandler(async (req, res) => {
    const { skip, limit } = parsePagination(req.query, { defaultLimit: 50 });
    const articles = await Article.find({ author: req.params.id })
      .populate("author", "username email avatar")
      .populate("tags", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json(articles.map(toArticleSummary));
});
