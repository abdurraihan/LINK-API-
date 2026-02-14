import express from "express";
import notificationController from "./notification.controller.js";
import { verifyUser } from "../../middlewares/auth.middleware.js";
const router = express.Router();
router.use(verifyUser);
// ================= STATIC ROUTES FIRST =================
// Register FCM token
router.post("/register-token", notificationController.registerToken);
// Unregister FCM token
router.delete("/unregister-token", notificationController.unregisterToken);
// Clear all notifications
router.delete("/clear-all", notificationController.clearAll);
// Mark all as read
router.patch("/read-all", notificationController.markAllAsRead);
// Get unread count
router.get("/unread-count", notificationController.getUnreadCount);
// Test notification
router.post("/test", notificationController.testNotification);
// ================= DYNAMIC ROUTES LAST =================
// Get notifications
router.get("/", notificationController.getNotifications);
// Mark single notification as read
router.patch("/:id/read", notificationController.markAsRead);
// Delete single notification
router.delete("/:id", notificationController.deleteNotification);
export default router;
