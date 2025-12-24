
import jwt from "jsonwebtoken";
import { JWT_SECRET,  JWT_REFRESH_SECRET } from "../config/config.js";

interface TokenPayload {
  id: string;
}

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
};


export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

export const generateTokens = (userId: string) => {
  return {
    access_token: generateAccessToken(userId),
    refresh_token: generateRefreshToken(userId),
  };
};


export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};


export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
};