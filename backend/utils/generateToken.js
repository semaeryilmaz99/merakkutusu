import jwt from "jsonwebtoken";

const generateToken = (id, role) => {
    return jwt.sign({id, role}, process.env.JWT_SECRET, {
        expiresIn: "1h"
    });
};

export const generateRefreshToken = (id) => {
    return jwt.sign({id}, process.env.JWT_REFRESH_SECRET, {
        expiresIn: "30d"
    });
};

export default generateToken;
