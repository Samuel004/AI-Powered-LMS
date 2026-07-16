import express from "express";
import { protectRoute, isAdmin } from "../middleware/auth.middleware.js";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  broadcastNotification,
  getNotificationStats
} from "../controllers/notification.controller.js";

const router = express.Router();

// Get user notifications
router.get("/", protectRoute, getUserNotifications);

// Mark notification as read
router.put("/:notificationId/read", protectRoute, markAsRead);

// Mark all as read
router.put("/all/read", protectRoute, markAllAsRead);

// Delete notification
router.delete("/:notificationId", protectRoute, deleteNotification);

// Get notification stats
router.get("/stats", protectRoute, getNotificationStats);

// Admin: Broadcast notification
router.post("/admin/broadcast", protectRoute, isAdmin, broadcastNotification);

export default router;
