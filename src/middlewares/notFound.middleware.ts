import { Request, Response, NextFunction } from "express";

const notFound = (req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    method: req.method,
    path: req.originalUrl
  });
};

export default notFound;
