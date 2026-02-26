import express from "express";
import {
  getAllContent,
  getContentDetails,
  deleteContent,
} from "./manageContent.controller.js";
import { verifyAdmin } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/contents", verifyAdmin, getAllContent);

router.get(
  "/contents/:type/:contentId",
  verifyAdmin,
  getContentDetails
);

router.delete(
  "/contents/:type/:contentId",
  verifyAdmin,
  deleteContent
);

export default router;