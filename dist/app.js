import express from "express";
import cors from "cors";
import notFound from "./middlewares/notFound.middleware.js";
import { globalErrorHandler } from './utils/errorHandler.js';
import userRouter from "./modules/user/user.route.js";
import channelRouter from "./modules/channel/chennel.route.js";
import postRouter from "./modules/post/post.router.js";
import videoRoutes from "./modules/video/video.router.js";
import shortsRoutes from "./modules/shorts/shorts.router.js";
import reactRoutes from "./modules/react/react.router.js";
import commentRoutes from "./modules/comment/comment.router.js";
import commentReactRoutes from "./modules/commentReact/commentReact.router.js";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
// app.use((req, _res, next) => {
//   console.log("Incoming request:", req.method, req.url);
//   next();
// });
app.get("/health", (req, res) => {
    console.log("hiting");
    res.json({ status: "OK", message: "Server is healthy" });
});
// API routes 
app.use("/api/user", userRouter);
app.use("/api/channel", channelRouter);
app.use("/api/post", postRouter);
app.use("/api/video", videoRoutes);
app.use("/api/shorts/", shortsRoutes);
app.use("/api/v1/reactions", reactRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/comment-reactions", commentReactRoutes);
app.use(globalErrorHandler);
app.use(notFound);
export default app;
