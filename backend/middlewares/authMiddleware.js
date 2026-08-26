// JWT token işlemleri için jsonwebtoken kütüphanesini import ediyoruz
import jwt from "jsonwebtoken";
// Kullanıcı modelini import ediyoruz
import User from "../models/User.js";
import Blacklist from "../models/Blacklist.js";

/**
 * Korumalı rotalar için authentication middleware
 * Bu middleware, isteklerin geçerli bir JWT token ile geldiğini kontrol eder
 * @param {Object} req - Express request objesi
 * @param {Object} res - Express response objesi
 * @param {Function} next - Sonraki middleware'e geçmek için callback fonksiyonu
 */
export const protect = async (req, res, next) => {
    // Token değişkenini tanımlıyoruz
    let token;

    // Authorization header'ının var olup olmadığını ve "Bearer" ile başlayıp başlamadığını kontrol ediyoruz
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            // Authorization header'ından token'ı çıkarıyoruz
            // Format: "Bearer <token>" -> split(" ")[1] ile token kısmını alıyoruz
            token = req.headers.authorization.split(" ")[1];

            // Token'ın blacklistte olup olmadığını kontrol ediyoruz.
            const blacklisted = await Blacklist.findOne({token});
            if (blacklisted) {
                return res.status(401).json({message: "Token geçersiz, çıkış yapılmış."});
            }
            // JWT token'ını doğruluyoruz ve içindeki bilgileri çözümlüyoruz
            // process.env.JWT_SECRET ile token'ın imzalandığı secret key'i kullanıyoruz
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Token'dan gelen user ID ile veritabanından kullanıcıyı buluyoruz
            // .select("-password") ile şifre alanını hariç tutuyoruz (güvenlik için)
            req.user = await User.findById(decoded.id).select("-password");
            if (!req.user) {
                return res.status(401).json({message: "Kullanıcı bulunamadı."});
            }
            // İşlem başarılıysa sonraki middleware'e geçiyoruz
            next();
        } catch (err) {
            // Token doğrulama hatası durumunda 401 Unauthorized döndürüyoruz
            return res.status(401).json({message: "Token geçersiz veya süresi dolmuş."});
        }
    }

    // Eğer hiç token yoksa 401 Unauthorized döndürüyoruz
    if (!token) return res.status(401).json({message: "Token gereklidir"})
};

/**
 * Token varsa doğrulayıp req.user'ı set eder, token yoksa veya geçersizse
 * hata döndürmeden isteğe devam eder. Hem giriş yapmış hem anonim kullanıcıların
 * erişebildiği route'lar (örn. tek makale görüntüleme) için kullanılır.
 */
export const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
        return next();
    }

    try {
        const token = authHeader.split(" ")[1];

        const blacklisted = await Blacklist.findOne({token});
        if (blacklisted) return next();

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
    } catch (err) {
        // Geçersiz/süresi dolmuş token: anonim kullanıcı gibi devam et
    }

    next();
};