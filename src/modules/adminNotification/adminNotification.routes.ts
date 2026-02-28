import express from "express";
import adminNotificationController from "./adminNotification.controller.js";
import { verifyAdmin } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// All admin notification routes require admin auth
router.use(verifyAdmin);

// ===== STATIC ROUTES FIRST (order matters!) =====
router.get("/unread-count",  adminNotificationController.getUnreadCount);
router.patch("/read-all",    adminNotificationController.markAllAsRead);
router.delete("/clear-all",  adminNotificationController.clearAll);

// ===== DYNAMIC ROUTES LAST =====
router.get("/",              adminNotificationController.getNotifications);
router.patch("/:id/read",    adminNotificationController.markAsRead);
router.delete("/:id",        adminNotificationController.deleteNotification);

// Add this in the STATIC ROUTES section
router.post("/test", adminNotificationController.testNotification);


export default router;