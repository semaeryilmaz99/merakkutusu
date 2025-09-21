import crypto from "crypto";
import {sendEmail} from "../config/mailer.js";

import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

//User Register
export const registerUser = async (req, res) => {
    try {
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
        } catch (err) {
        res.status(500).json({message: err.message});
        }
};

//User login
export const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email});

        if (!user)
            return res.status(401).json({ message: "Geçersiz email veya şifre" });

         // Eğer kullanıcı email doğrulamadıysa
        if (!user.isVerified)
            return res.status(401).json({ message: "Lütfen emailinizi doğrulayın." });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id, user.role)
            });
        } else {
            res.status(401).json({message: "Geçersiz email veya şifre"});
        }
    } catch (err) {
        res.status(500).json({message: err.message});
    }
};

//Email doğrulama
export const verifyUser = async (req, res) => {
    try {
        const {token} = req.params;
        const user = await User.findOne({verificationToken: token});

        if (!user) return res.status(400).json({message: "Geçersiz token"});

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.json({message: "Email doğrulama başarılı."});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
};

//Şifre sıfırlama
export const forgotPassword = async (req, res) => {
    try {
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
    } catch (err) {
        res.status(500).json({message: err.message});
    }
};

export const resetPassword = async (req, res) => {
    try {
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
    } catch (err) {
        res.status(500).json({message: err.message});
    }
};