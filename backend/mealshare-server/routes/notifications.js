// routes/notifications.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/notifications.controller");

// GET /api/notifications/admin - Get admin notifications
router.get("/admin", ctrl.getAdminNotifications);

// GET /api/notifications/email/:email - Get notifications for specific user by email
router.get("/email/:email", ctrl.getEmailNotifications);

// PUT /api/notifications/:id/read - Mark single notification as read
router.put("/:id/read", ctrl.markAsRead);

// POST /api/notifications - Create notification manually
router.post("/", ctrl.createNotification);

// DELETE /api/notifications/delete-all - Delete all notifications for user
// Must be BEFORE /:id route to avoid matching "delete-all" as an ID
router.delete("/delete-all", ctrl.deleteAllNotifications);

// DELETE /api/notifications/:id - Delete notification
router.delete("/:id", ctrl.deleteNotification);

module.exports = router;

