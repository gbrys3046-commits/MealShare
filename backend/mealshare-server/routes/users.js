const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../db");
const notificationsController = require("../controllers/notifications.controller");

const SALT_ROUNDS = 10;

console.log("✅ users routes file loaded");





router.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});






/*
GET /api/users
Fetch all users (for admin)
*/
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
        id, name, email, role, phone, address, 
        description, lat, lng, is_active, created_at 
      FROM users 
      ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch users error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/*
GET /api/users/:email
Fetch single user by email
*/
router.get("/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const [rows] = await db.execute(
      `SELECT 
        id, name, email, role, phone, address, 
        description, lat, lng, is_active, created_at 
      FROM users 
      WHERE email = ? 
      LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Fetch user error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/*
DELETE /api/users/:id
Delete user
*/
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  console.log(`[users] DELETE /api/users/${id} called`); 

  
  try {
    // 1) Read user first to get email and role for notification
    const [rows] = await db.execute("SELECT email, role FROM users WHERE id = ?", [id]);
    if (!rows || rows.length === 0) {
      console.log(`[users] user ${id} not found`);
      return res.status(404).json({ error: "User not found" });
    }
    const user = rows[0]; // { email, role }
    console.log(`[users] will delete user:`, user);

    // 2) (Optional) Delete related records first if needed
    // await db.execute("DELETE FROM requests WHERE charity_id = ? OR restaurant_id = ?", [id, id]);

    // 3) Delete user
    const [result] = await db.execute("DELETE FROM users WHERE id = ?", [id]);
    console.log(`[users] delete result:`, result);

    if (result.affectedRows === 0) {
      console.log(`[users] no rows affected for id ${id}`);
      return res.status(404).json({ error: "User not found" });
    }

    // 4) Prepare notification payload
    const payload = {
      receiver_type: "role",
      receiver_role: "admin",
      sender_id: req.session?.user?.id || null, // من قام بالعملية — أفضل من استخدام id المحذوف
      type: "user.deleted",
      title: "تم حذف حساب",
      message: `تم حذف حساب المستخدم: ${user.email || ("#"+id)}`,
      meta: { role: user.role || null }
    };

    // 5) Send notification safely (don't block response if fails)
    if (typeof notificationsController !== "undefined" &&
        typeof notificationsController.createNotificationDirect === "function") {
      // لا تنتظر النتيجة حتى لا تؤخر الرد
      notificationsController.createNotificationDirect(payload)
      .then(n => console.log("[notifications] created:", n))
      .catch(err => console.error("[notifications] failed (non-fatal):", err));
    } else {
      console.warn("[notifications] controller unavailable or method missing. Skipping notification.");
    }

    // 6) Return final response to client
    return res.json({ message: "User deleted successfully", user_id: id });

  } catch (err) {
    console.error("❌ Delete user error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});


/*
PUT /api/users/:id/status
Activate/Deactivate user account
*/
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    let { is_active } = req.body;

    // Accept boolean, 0/1, or "0"/"1"
    if (typeof is_active === "string") {
      if (["0","1"].includes(is_active)) is_active = Number(is_active);
    }
    if (typeof is_active !== "boolean" && ![0, 1].includes(is_active)) {
      return res.status(400).json({ error: "Invalid is_active value" });
    }

    const [result] = await db.execute(
      "UPDATE users SET is_active = ? WHERE id = ?",
      [ is_active ? 1 : 0, id ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch user data (email, role) for notification
    const [rows] = await db.execute("SELECT email, role FROM users WHERE id = ?", [id]);
    const user = rows && rows[0] ? rows[0] : null;
    const userEmail = user ? user.email : null;
    const userRole = user ? user.role : null;

    // Try to create notification - don't stop response if fails
    try {
      await notificationsController.createNotificationDirect({
        receiver_type: "role",
        receiver_role: "admin",
        sender_id: id, // من قام بالتأثير (هنا نستخدم id المستخدم الذي تغيّر)
        type: "user.status.updated",
        title: "تم تحديث حالة الحساب",
        message: `تم ${is_active ? 'تفعيل' : 'تعطيل'} حساب المستخدم${userEmail ? `: ${userEmail}` : ''}`,
        meta: {
          role: userRole,
          is_active: !!is_active
        }
      });
    } catch (notifErr) {
      console.error("Notification error (non-fatal):", notifErr);
      // Don't return error to client since update succeeded
    }

    res.json({
      message: is_active ? "User activated" : "User deactivated",
      user_id: id
    });

  } catch (err) {
    console.error("❌ Update user status error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/*
PUT /api/users/by-email/:email
Edit user data by email
*/

router.put("/by-email/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { name, phone, address, desc, lat, lng, email: newEmail, password } = req.body;

    // Get user role first (needed for cascading updates)
    const [userRows] = await db.execute('SELECT role FROM users WHERE email = ?', [email]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userRole = userRows[0].role;

    // Build update query dynamically
    let updateFields = [];
    let values = [];

    if (name !== undefined) {
      updateFields.push("name = ?");
      values.push(name);
    }
    if (phone !== undefined) {
      updateFields.push("phone = ?");
      values.push(phone);
    }
    if (address !== undefined) {
      updateFields.push("address = ?");
      values.push(address);
    }
    if (desc !== undefined) {
      updateFields.push("description = ?");
      values.push(desc);
    }
    if (lat !== undefined) {
      updateFields.push("lat = ?");
      values.push(lat);
    }
    if (lng !== undefined) {
      updateFields.push("lng = ?");
      values.push(lng);
    }
    
    const emailChanged = newEmail !== undefined && newEmail !== email;
    if (emailChanged) {
      updateFields.push("email = ?");
      values.push(newEmail);
    }
    if (password !== undefined && password.length >= 6) {
      // Hash new password using bcrypt
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      updateFields.push("password_hash = ?");
      values.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(email); // WHERE email = ?

    const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE email = ?`;
    const [result] = await db.execute(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // ⚠️ CRITICAL: Cascade email change to ALL related tables
    // This prevents data loss when user changes their email
    if (emailChanged) {
      console.log(`🔄 Cascading email change: ${email} → ${newEmail}`);
      
      try {
        // Update surpluses (for restaurants)
        if (userRole === 'restaurant') {
          await db.execute(
            'UPDATE surpluses SET restaurant_email = ? WHERE restaurant_email = ?',
            [newEmail, email]
          );
          console.log('✅ Updated surpluses with new email');
        }

        // Update requests - both restaurant_email and charity_email
        if (userRole === 'restaurant') {
          await db.execute(
            'UPDATE requests SET restaurant_email = ? WHERE restaurant_email = ?',
            [newEmail, email]
          );
          console.log('✅ Updated requests (restaurant_email) with new email');
        }
        if (userRole === 'charity') {
          await db.execute(
            'UPDATE requests SET charity_email = ? WHERE charity_email = ?',
            [newEmail, email]
          );
          console.log('✅ Updated requests (charity_email) with new email');
        }

        // Update ratings
        if (userRole === 'restaurant') {
          await db.execute(
            'UPDATE ratings SET restaurant_email = ? WHERE restaurant_email = ?',
            [newEmail, email]
          );
          console.log('✅ Updated ratings (restaurant_email) with new email');
        }
        if (userRole === 'charity') {
          await db.execute(
            'UPDATE ratings SET charity_email = ? WHERE charity_email = ?',
            [newEmail, email]
          );
          console.log('✅ Updated ratings (charity_email) with new email');
        }

        // Update notifications where receiver_role = old email
        await db.execute(
          'UPDATE notifications SET receiver_role = ? WHERE receiver_role = ?',
          [newEmail, email]
        );
        console.log('✅ Updated notifications with new email');

        console.log(`✅ Successfully cascaded email change to all related tables`);
      } catch (cascadeErr) {
        console.error('❌ Error cascading email change:', cascadeErr);
        // Don't fail the main update, but log the error
      }
    }

    // ⚠️ CRITICAL: Update session with new user data
    // This ensures the frontend gets the updated data immediately
    if (req.session && req.session.user && req.session.user.email === email) {
      // Update session fields
      if (name !== undefined) req.session.user.name = name;
      if (phone !== undefined) req.session.user.phone = phone;
      if (address !== undefined) req.session.user.address = address;
      if (desc !== undefined) req.session.user.description = desc;
      if (lat !== undefined) req.session.user.lat = lat;
      if (lng !== undefined) req.session.user.lng = lng;
      if (emailChanged) {
        req.session.user.email = newEmail;
      }
      
      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
        } else {
          console.log("✅ Session updated for:", req.session.user.email);
        }
      });
    }

    console.log("✅ User updated:", email);
    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error("❌ Update user by email error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
