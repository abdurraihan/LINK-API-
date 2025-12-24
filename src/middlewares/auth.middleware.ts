import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.utils.js";

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Middleware to verify JWT token and authenticate user
 */
export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "fail",
        message: "No token provided. Authorization denied.",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "No token provided. Authorization denied.",
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach user ID to request object
    req.userId = decoded.id;

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          status: "fail",
          message: "Token expired. Please refresh your token.",
        });
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          status: "fail",
          message: "Invalid token. Authorization denied.",
        });
      }
    }

    return res.status(500).json({
      status: "error",
      message: "Server error during authentication.",
    });
  }
};

/**
 * Optional middleware - doesn't fail if token is missing
 */
export const verifyUserOptional = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const decoded = verifyAccessToken(token);
        req.userId = decoded.id;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};