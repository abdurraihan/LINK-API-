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
router.post("/create", verifyUser, createReport); // create repost by user 
router.get("/my", verifyUser, getMyReports);
router.delete("/:reportId", verifyUser, deleteMyReport);

/* ADMIN */
router.get("/admin", verifyAdmin, getAllReportsAdmin); // get all report -  by status 
router.get("/admin/:reportId", verifyAdmin, getSingleReportAdmin); // get single repost by admin 
router.get("/admin/:reportId/content", verifyAdmin, viewReportedContent); // view report content by admin 
router.patch("/admin/:reportId/status", verifyAdmin, updateReportStatus); // change repost status
router.delete("/admin/content/:type/:id", verifyAdmin, deleteContentByAdmin); // delete reported content by content type and content id by admin 

export default router;
