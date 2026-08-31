import crypto from "crypto";
import {sendEmail} from "../config/mailer.js";
import Blacklist from "../models/Blacklist.js";

import jwt from "jsonwebtoken";
import User from "../models/User.js";
import generateToken, { generateRefreshToken } from "../utils/generateToken.js";
import asyncHandler from "../utils/asyncHandler.js";

//User Register
export const registerUser = asyncHandler(async (req, res) => {
        const {username, email, password} = req.body;
        //Bu mail ile kaydolan kullanıcı var mı?
        const userExists = await User.findOne({email});
        if (userExists) return res.status(400).json({message: "Bu email adresi zaten kayıtlı."});

        const verificationToken = crypto.randomBytes(32).toString("hex");

        // kullanıcı oluştur
        const user = await User.create({
        username,
        email,
        password,
        verificationToken,
        isVerified: false
        });

        //Doğrulama linki oluşturma
        const verifyUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;

        const html = `
        <h3>Merakkutusu Email Doğrulama</h3>
        <p>Hesabınızı doğrulamak için <a href="${verifyUrl}">tıklayın</a></p>
        `;
        await sendEmail(user.email, "Email Doğrulama", html);

        res.status(201).json({message: "Kayıt başarılı, Doğrulama emaili gönderildi."});
});

//User login
export const loginUser = asyncHandler(async (req, res) => {
        const {email, password} = req.body;
        const user = await User.findOne({email});

        if (!user)
            return res.status(401).json({ message: "Geçersiz email veya şifre" });

         // Eğer kullanıcı email doğrulamadıysa
        if (!user.isVerified)
            return res.status(401).json({ message: "Lütfen emailinizi doğrulayın." });

        if (user && (await user.matchPassword(password))) {
            const refreshToken = generateRefreshToken(user._id);
            user.refreshToken = refreshToken;
            await user.save();

            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id, user.role),
                refreshToken
            });
        } else {
            res.status(401).json({message: "Geçersiz email veya şifre"});
        }
});

// Access token'ı refresh token ile yenileme (rotation)
export const refreshAccessToken = asyncHandler(async (req, res) => {
        const {refreshToken} = req.body;
        if (!refreshToken) return res.status(400).json({message: "Refresh token gereklidir."});

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            return res.status(401).json({message: "Refresh token geçersiz veya süresi dolmuş."});
        }

        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({message: "Refresh token geçersiz."});
        }

        const newRefreshToken = generateRefreshToken(user._id);
        user.refreshToken = newRefreshToken;
        await user.save();

        res.json({
            token: generateToken(user._id, user.role),
            refreshToken: newRefreshToken
        });
});

//Email doğrulama
export const verifyUser = asyncHandler(async (req, res) => {
        const {token} = req.params;
        const user = await User.findOne({verificationToken: token});

        if (!user) return res.status(400).json({message: "Geçersiz token"});

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.json({message: "Email doğrulama başarılı."});
});

//Şifre sıfırlama
export const forgotPassword = asyncHandler(async (req, res) => {
        const {email} = req.body;
        const user = await User.findOne({email});
        if (!user) return res.status(400).json({message: "Bu email adresi kayıtlı değil."});

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;  //1h
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const html = `<p>Şifreni sıfırlamak için <a href="${resetUrl}">tıkla</a></p>`;

        await sendEmail(user.email, "Şifre Sıfırlama", html);

        res.json({message: "Şifre sıfırlama maili gönderildi."});
});

export const resetPassword = asyncHandler(async (req, res) => {
        const {token} = req.params;
        const {password} = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: {$gt: Date.now()}
        });

        if (!user) return res.status(400).json({message: "Geçersiz veya süresi dolmuş token."});

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({message: "Şifre başarıyla sıfırlandı."});
});

// User Logout
export const logoutUser = asyncHandler(async (req, res) => {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) return res.status(400).json({message: "Token bulunamadı."});

        // Token'ı blackliste ekle
        await Blacklist.create({token});

        // Geçerliyse, kullanıcının refresh token'ını da geçersiz kıl
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            await User.findByIdAndUpdate(decoded.id, { refreshToken: undefined });
        } catch (err) {
            // Token zaten geçersiz/süresi dolmuşsa refresh token temizliğine gerek yok
        }

        res.json({message: "Başarıyla çıkış yapıldı."});
});
