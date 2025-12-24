import { verifyAccessToken } from "../utils/jwt.utils.js";
export const verifyUser = async (req, res, next) => {
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
    }
    catch (error) {
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
export const verifyUserOptional = async (req, res, next) => {
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
    }
    catch (error) {
        next();
    }
};
