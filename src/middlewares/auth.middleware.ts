import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.utils.js";
import  Admin  from "../modules/admin/admin.model.js";


declare global {
  namespace Express {
    interface Request {
      userId?: string;
       adminId?: string;
    }
  }
}


export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "fail",
        message: "No token provided. Authorization denied.",
      });
    }

 
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "No token provided. Authorization denied.",
      });
    }

  
    const decoded = verifyAccessToken(token);

   
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



// Admin Verifier Middleware
export const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "fail",
        message: "No token provided. Authorization denied.",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "No token provided. Authorization denied.",
      });
    }

    const decoded = verifyAccessToken(token);
    const admin = await Admin.findById(decoded.id); // Find admin from token id

    if (!admin) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have admin rights.",
      });
    }

    req.adminId = admin._id.toString(); // Store admin ID in request

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