import { Router } from "express";
import { saveContent, getSavedContent } from "./save.controller.js";
import { verifyUser } from "../../middlewares/auth.middleware.js";

const saveRouter = Router();

// Route to save content
saveRouter.post("/save", verifyUser, saveContent);

// Route to get saved content
saveRouter.get("/saved", verifyUser, getSavedContent);

export default saveRouter;
