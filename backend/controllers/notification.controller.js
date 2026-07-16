import Notification from "../models/Notification.model.js";

// Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { unreadOnly = false, page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;
    const filter = { recipient: userId };

    if (unreadOnly === "true") {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .populate("sender", "name email")
      .populate("relatedCourse", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);

    return res.status(200).json({
      notifications,
      unreadCount: await Notification.countDocuments({ recipient: userId, isRead: false }),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Verify ownership
    if (notification.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({ message: "Marked as read", notification });
  } catch (error) {
    return res.status(500).json({ message: "Error updating notification", error: error.message });
  }
};

// Mark all as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    return res.status(500).json({ message: "Error updating notifications", error: error.message });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Verify ownership
    if (notification.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Notification.deleteOne({ _id: notificationId });

    return res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting notification", error: error.message });
  }
};

// Send notification (internal - used by other controllers)
export const sendNotification = async (recipientId, type, title, message, relatedCourse = null, priority = "medium") => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      type,
      title,
      message,
      relatedCourse,
      priority,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
    return null;
  }
};

// Broadcast notification to multiple users
export const broadcastNotification = async (req, res) => {
  try {
    const { userIds, type, title, message, priority = "medium" } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "Invalid user IDs" });
    }

    const notifications = [];
    for (const userId of userIds) {
      const notification = new Notification({
        recipient: userId,
        type,
        title,
        message,
        priority
      });
      notifications.push(notification);
    }

    await Notification.insertMany(notifications);

    return res.status(201).json({
      message: "Notifications sent",
      count: notifications.length
    });
  } catch (error) {
    return res.status(500).json({ message: "Error sending notifications", error: error.message });
  }
};

// Get notification statistics
export const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const stats = await Notification.aggregate([
      { $match: { recipient: userId } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] }
          }
        }
      }
    ]);

    const total = await Notification.countDocuments({ recipient: userId });
    const unreadTotal = await Notification.countDocuments({ recipient: userId, isRead: false });

    return res.status(200).json({
      total,
      unreadTotal,
      byType: stats
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching stats", error: error.message });
  }
};
