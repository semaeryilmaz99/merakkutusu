import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

//User Register
export const registerUser = async (req, res) => {
    try {
        const {username, email, password} = req.body;
        //Bu mail ile kaydolan kullanıcı var mı?
        const userExists = await User.findOne({email});
        if (userExists) return res.status(400).json({message: "Bu email adresi zaten kayıtlı."});
        //Eğer yoksa yeni kullanıcıyı kaydet
        const user = await User.create({username, email, password});
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: generateToken(user._id, user.role)
        });
    } catch (err) {
        res.status(500).json({message: err.message});
    }
};

//User login
export const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email});

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