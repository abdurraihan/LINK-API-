import express from "express";
const app = express();
/* Middleware */
app.use(express.json());
/* Health check */
app.get("/health", (_, res) => {
    res.json({ status: "OK", message: "Server is healthy" });
});
export default app;
