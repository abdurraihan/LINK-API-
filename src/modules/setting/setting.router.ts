import express from "express";
import {
  getSettings,
  upsertSettings,
} from "./setting.controller.js"
import { verifyAdmin } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Public route (mobile app / website)
router.get("/", getSettings);

// Admin update
router.put("/", verifyAdmin, upsertSettings);

export default router;