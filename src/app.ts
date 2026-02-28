import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import express, { Request, Response } from "express";

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
import followRoutes from "./modules/follow/follow.router.js";
import notificationRoutes from "./modules/userNotification/userNotification.router.js";
import searchRoutes from "./modules/Search/searchRoutes.js"
import saveRouter from "./modules/save/save.router.js";
import historyRouter from "./modules/history/history.router.js"
import adminRouter from "./modules/admin/admin.router.js"
import reportRouter from "./modules/report/report.router.js"
import settingRouter from "./modules/setting/setting.router.js"
import bannerRoutes from "./modules/Banner/bannar.router.js";
import userManagementRoutes from "./modules/userManagement/userManagement.router.js";
import mangeContentRoutes from "./modules/manageContent/manageContent.router.js"
import adminNotificationRoutes from "./modules/adminNotification/adminNotification.routes.js";
import { socketService } from "./utils/socket.utils.js";

dotenv.config();

const app = express();


// ✅ CREATE HTTP SERVER
const server = http.createServer(app);


// ✅ INITIALIZE SOCKET.IO
socketService.initialize(server);


// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));


app.get("/health", (req: Request, res: Response) => {

  res.json({
    status: "OK",
    message: "Server healthy",
    socketIO: "active",
    firebase: "configured"
  });

});


// Routes
app.use("/api/user", userRouter);
app.use("/api/channel", channelRouter);
app.use("/api/post", postRouter);
app.use("/api/video", videoRoutes);
app.use("/api/shorts", shortsRoutes);
app.use("/api/v1/reactions", reactRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/comment-reactions", commentReactRoutes);
app.use("/api/v1/follows", followRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/search", searchRoutes)
app.use("/api/v1/save", saveRouter)
app.use("/api/v1/history", historyRouter)
app.use("/api/v1/admin", adminRouter)
app.use("/api/v1/report", reportRouter)
app.use("/api/v1/setting", settingRouter)
app.use("/api/v1/banners", bannerRoutes);
app.use("/api/v1/user-management", userManagementRoutes);
app.use("/api/v1/manage-contents",mangeContentRoutes);
app.use("/api/v1/admin/notifications", adminNotificationRoutes);


// Error handlers
app.use(globalErrorHandler);
app.use(notFound);


// ✅ EXPORT SERVER (NOT app)
export default server;
