import { Router } from "express";
import { chat, generateImage, getHistory } from "./ai.controller.js";
import { verifyUser } from "../../middlewares/auth.middleware.js"; 

const router = Router();

// All routes require a logged-in user
router.use(verifyUser);

router.post("/chat", chat);
router.post("/image", generateImage);
router.get("/history", getHistory);

export default router;