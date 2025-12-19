import express from "express";
import {Request, Response } from "express";
import notFound from "./middlewares/notFound.middleware.js";

const app = express();


app.use(express.json());

app.use((req, _res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});


app.get("/health", (req:Request, res:Response) => {
    console.log("hiting")
  res.json({ status: "OK", message: "Server is healthy" });
});


app.use(notFound)
export default app;
