import { body, validationResult } from "express-validator";

// Tüm validator zincirlerinden sonra route'a eklenir, hataları toplayıp 400 döner
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Geçersiz istek verisi",
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

export const registerValidator = [
  body("username").trim().notEmpty().withMessage("Kullanıcı adı gereklidir")
    .isLength({ min: 3, max: 30 }).withMessage("Kullanıcı adı 3-30 karakter olmalı"),
  body("email").trim().isEmail().withMessage("Geçerli bir email adresi girin").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Şifre en az 6 karakter olmalı")
];

export const loginValidator = [
  body("email").trim().isEmail().withMessage("Geçerli bir email adresi girin").normalizeEmail(),
  body("password").notEmpty().withMessage("Şifre gereklidir")
];

export const forgotPasswordValidator = [
  body("email").trim().isEmail().withMessage("Geçerli bir email adresi girin").normalizeEmail()
];

export const resetPasswordValidator = [
  body("password").isLength({ min: 6 }).withMessage("Şifre en az 6 karakter olmalı")
];

export const createArticleValidator = [
  body("title").trim().notEmpty().withMessage("Başlık gereklidir")
    .isLength({ max: 200 }).withMessage("Başlık en fazla 200 karakter olabilir"),
  body("content").trim().notEmpty().withMessage("İçerik gereklidir")
    .isLength({ max: 20000 }).withMessage("İçerik en fazla 20000 karakter olabilir")
];

export const addCommentValidator = [
  body("text").trim().notEmpty().withMessage("Yorum boş olamaz")
    .isLength({ max: 1000 }).withMessage("Yorum en fazla 1000 karakter olabilir")
];

export const updateProfileValidator = [
  body("bio").optional().trim().isLength({ max: 300 }).withMessage("Bio en fazla 300 karakter olabilir")
];

export const setInterestsValidator = [
  body("tagIds").isArray().withMessage("tagIds bir dizi olmalı")
];