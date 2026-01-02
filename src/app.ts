import express from "express";
import {Request, Response } from "express";
import cors from "cors"
import notFound from "./middlewares/notFound.middleware.js";
import { globalErrorHandler } from './utils/errorHandler.js';
import userRouter from "./modules/user/user.route.js";
import channelRouter from "./modules/channel/chennel.route.js";
import postRouter from "./modules/post/post.router.js"
import dotenv from "dotenv";


dotenv.config();

const app = express();
app.use(cors());

app.use(express.json());

// app.use((req, _res, next) => {
//   console.log("Incoming request:", req.method, req.url);
//   next();
// });


app.get("/health", (req:Request, res:Response) => {
    console.log("hiting")
  res.json({ status: "OK", message: "Server is healthy" });
});


// api routes 
app.use("/api/user", userRouter);
app.use("/api/channel",channelRouter);
app.use("/api/post",postRouter);




app.use(globalErrorHandler);
app.use(notFound)


export default app;
