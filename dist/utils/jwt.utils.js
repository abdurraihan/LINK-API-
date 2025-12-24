import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_REFRESH_SECRET } from "../config/config.js";
export const generateAccessToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
};
export const generateRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};
export const generateTokens = (userId) => {
    return {
        access_token: generateAccessToken(userId),
        refresh_token: generateRefreshToken(userId),
    };
};
export const verifyAccessToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};
export const verifyRefreshToken = (token) => {
    return jwt.verify(token, JWT_REFRESH_SECRET);
};
