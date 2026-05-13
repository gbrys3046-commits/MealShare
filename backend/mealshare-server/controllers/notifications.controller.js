// controllers/notifications.controller.js
const db = require("../db");

async function createNotification(opts) {
 
  const { receiver_type,receiver_id = null,receiver_role = null, sender_id = null,type,title,message,action_url = null, meta = null} = opts; 

  
  const sql = `
    INSERT INTO notifications
      (receiver_type, receiver_id, receiver_role, sender_id, type, title, message, action_url, meta, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
  `;

  const metaStr = typeof meta === 'string' ? meta : (meta ? JSON.stringify(meta) : null);

  const [result] = await db.execute(sql, [
    receiver_type,
    receiver_id,
    receiver_role,
    sender_id,
    type,
    title,
    message,
    action_url,
    metaStr
  ]);

  return result.insertId;
}


// API Route Handlers

// POST /api/notifications - Create notification manually
exports.createNotification = async (req, res) => {
  try {
    const payload = req.body;

    console.log("📝 Creating notification with payload:", JSON.stringify(payload, null, 2));

    const id = await createNotification(payload);

    console.log("✅ Notification created with ID:", id);
    res.status(201).json({ message: "Notification created", id });
  } catch (err) {
    console.error("❌ createNotification error:", err.message);
    console.error("Full error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};


// GET /api/notifications/admin - Admin notifications
exports.getAdminNotifications = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM notifications 
       WHERE receiver_type = 'role' AND receiver_role = 'admin' 
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("getAdminNotifications error:", err);
    res.status(500).json({ error: "Server error" });
  }
};



// GET /api/notifications/email/:email - Notifications for specific user by email
exports.getEmailNotifications = async (req, res) => {
  try {
    const { email } = req.params;

    // Get user role from users table
    const [userRows] = await db.execute('SELECT role FROM users WHERE email = ?', [email]);
    const userRole = userRows.length > 0 ? userRows[0].role : null;

    // Get user notifications by email + general role notifications
    const [rows] = await db.execute(
      `SELECT * FROM notifications
       WHERE receiver_role = ?
          OR (receiver_type = 'role' AND receiver_role = ?)
       ORDER BY created_at DESC`,
      [email, userRole]
    );

    res.json(rows);
  } catch (err) {
    console.error("getEmailNotifications error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// PUT /api/notifications/:id/read - Mark as read
exports.markAsRead = async (req, res) => {
  try {
    const id = req.params.id;
    const [result] = await db.execute(
      `UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?`,
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ message: "Marked as read" });
  } catch (err) {
    console.error("markAsRead error:", err);
    res.status(500).json({ error: "Server error" });
  }
};



// DELETE /api/notifications/:id - Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const id = req.params.id;
    const [result] = await db.execute(
      `DELETE FROM notifications WHERE id = ?`,
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error("deleteNotification error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE /api/notifications/delete-all - Delete all notifications for user
exports.deleteAllNotifications = async (req, res) => {
  try {
    const { role, user_id, email } = req.body;

    let sql, params;
    if (email) {
      sql = `DELETE FROM notifications WHERE receiver_role = ?`;
      params = [email];
    } else if (role) {
      sql = `DELETE FROM notifications WHERE receiver_type = 'role' AND receiver_role = ?`;
      params = [role];
    } else if (user_id) {
      sql = `DELETE FROM notifications WHERE receiver_type = 'user' AND receiver_id = ?`;
      params = [user_id];
    } else {
      return res.status(400).json({ error: "Missing role, user_id, or email" });
    }

    const [result] = await db.execute(sql, params);
    res.json({ message: `${result.affectedRows} notification(s) deleted` });
  } catch (err) {
    console.error("deleteAllNotifications error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Internal Export for other modules
exports.createNotificationDirect = createNotification;
