import express from "express";
import {
  createReport,
  getMyReports,
  deleteMyReport,
  getAllReportsAdmin,
  getSingleReportAdmin,
  viewReportedContent,
  updateReportStatus,
  deleteContentByAdmin,
} from "./report.controller.js";

import { verifyUser, verifyAdmin } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/* USER */
router.post("/create", verifyUser, createReport);
router.get("/my", verifyUser, getMyReports);
router.delete("/:reportId", verifyUser, deleteMyReport);

/* ADMIN */
router.get("/admin", verifyAdmin, getAllReportsAdmin);
router.get("/admin/:reportId", verifyAdmin, getSingleReportAdmin);
router.get("/admin/:reportId/content", verifyAdmin, viewReportedContent);
router.patch("/admin/:reportId/status", verifyAdmin, updateReportStatus);
router.delete("/admin/content/:type/:id", verifyAdmin, deleteContentByAdmin);

export default router;
