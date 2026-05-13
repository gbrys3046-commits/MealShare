const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../db");
const notificationsController = require("../controllers/notifications.controller");

const SALT_ROUNDS = 10;



// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: "البريد الإلكتروني وكلمة المرور مطلوبان"
      });
    }

    // Fetch user from database
    const [rows] = await db.execute(
      `SELECT 
        id, name, email, password_hash, role, phone, 
        address, description, lat, lng, is_active, created_at
      FROM users 
      WHERE email = ? 
      LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        error: "البريد الإلكتروني أو كلمة المرور غير صحيحة"
      });
    }

    const user = rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        error: "الحساب غير مفعل"
      });
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "البريد الإلكتروني أو كلمة المرور غير صحيحة"
      });
    }

    // Save user to session (this sets the cookie)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      description: user.description,
      lat: user.lat,
      lng: user.lng,
      created_at: user.created_at
    };

    req.session.user = userData;

    // Save session explicitly
    req.session.save(async (err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ error: "خطأ في حفظ الجلسة" });
      }


        // Notify Admin about user login
  try {
    await notificationsController.createNotificationDirect({
      receiver_type: "role",
      receiver_role: "admin",
      sender_id: user.id,
      type: "user.login",
      title: "تسجيل دخول",
      message: `تم تسجيل دخول المستخدم: ${user.email}`,
      meta: {
        user_id: user.id,
        role: user.role
      }
    });
    
  } catch (notifyErr) {
    console.error("⚠️ Notification error:", notifyErr);
    // Don't stop login if notification fails
  }

      console.log(`✅ Login successful: ${user.email} (Session: ${req.sessionID})`);

      res.json({
        success: true,
        message: "تم تسجيل الدخول بنجاح",
        user: userData
      });




      
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, phone, address, description, lat, lng } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "الاسم والبريد الإلكتروني وكلمة المرور مطلوبة"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "صيغة البريد الإلكتروني غير صحيحة"
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
      });
    }

    // Check if email already exists
    const [existing] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: "البريد الإلكتروني مستخدم بالفعل"
      });
    }

    // Validate role
    const validRoles = ["restaurant", "charity", "admin"];
    const userRole = validRoles.includes(role) ? role : "restaurant";

    // Insert user into database
    const sql = `
      INSERT INTO users 
      (name, email, password_hash, role, phone, address, description, lat, lng, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
    `;

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await db.execute(sql, [
      name,
      email,
      hashedPassword, // Securely hashed password
      userRole,
      phone || null,
      address || null,
      description || null,
      lat || null,
      lng || null
    ]);


  await notificationsController.createNotificationDirect({
  receiver_type: "role",
  receiver_role: "admin",
  sender_id: result.insertId,
  type: "user.registered",
  title: "تسجيل حساب جديد",
  message: `تم تسجيل حساب جديد: ${email}`,
  meta: {
  role: userRole
  }
});





    console.log(`✅ User registered: ${email}`);
   
    




    res.status(201).json({
      success: true,
      message: "تم إنشاء الحساب بنجاح",
      id: result.insertId,
      email: email,
      role: userRole
    });

  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// GET /api/auth/me
router.get("/me", (req, res) => {
  // Check if user is logged in (session exists)
  if (!req.session.user) {
    return res.status(401).json({ 
      error: "غير مسجل الدخول",
      authenticated: false 
    });
  }

  console.log(`📍 Session check: ${req.session.user.email}`);

  res.json({
    authenticated: true,
    user: req.session.user
  });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  const userEmail = req.session.user?.email || "unknown";

  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "خطأ في تسجيل الخروج" });
    }

    // Clear the cookie
    res.clearCookie('mealshare_session', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax'
    });

    console.log(`👋 Logout: ${userEmail}`);

    res.json({ 
      success: true, 
      message: "تم تسجيل الخروج بنجاح" 
    });
  });
});

// POST /api/auth/verify-password
router.post("/verify-password", async (req, res) => {
  try {
    // Must be logged in
    if (!req.session.user) {
      return res.status(401).json({ error: "غير مسجل الدخول" });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "كلمة المرور مطلوبة" });
    }

    const [rows] = await db.execute(
      `SELECT password_hash FROM users WHERE email = ? LIMIT 1`,
      [req.session.user.email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, rows[0].password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "كلمة المرور غير صحيحة" });
    }

    res.json({ success: true, message: "تم التحقق من كلمة المرور" });

  } catch (err) {
    console.error("❌ Verify password error:", err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /api/auth/check-email
router.post("/check-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
    }

    const [rows] = await db.execute(
      "SELECT id, email FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        exists: false, 
        error: "البريد الإلكتروني غير مسجل" 
      });
    }

    res.json({ 
      exists: true, 
      message: "البريد الإلكتروني موجود" 
    });

  } catch (err) {
    console.error("❌ Check email error:", err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /api/auth/check-email-available
router.post("/check-email-available", async (req, res) => {
  try {
    const { email, currentEmail } = req.body;

    if (!email) {
      return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        available: false, 
        error: "صيغة البريد الإلكتروني غير صحيحة" 
      });
    }

    // If checking the same email as current, it's available for this user
    if (currentEmail && email.toLowerCase() === currentEmail.toLowerCase()) {
      return res.json({ 
        available: true, 
        message: "البريد الإلكتروني الحالي" 
      });
    }

    // Check if email exists in database
    const [rows] = await db.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length > 0) {
      return res.status(409).json({ 
        available: false, 
        error: "البريد الإلكتروني مستخدم بالفعل" 
      });
    }

    res.json({ 
      available: true, 
      message: "البريد الإلكتروني متاح" 
    });

  } catch (err) {
    console.error("❌ Check email available error:", err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /api/auth/check-phone-available
router.post("/check-phone-available", async (req, res) => {
  try {
    const { phone, currentPhone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "رقم الهاتف مطلوب" });
    }

    // Validate phone format (Libyan phone: 09X XXXXXXX)
    const phoneRegex = /^09[1-4][0-9]{7}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ 
        available: false, 
        error: "صيغة رقم الهاتف غير صحيحة" 
      });
    }

    // If checking the same phone as current, it's available for this user
    if (currentPhone && phone === currentPhone) {
      return res.json({ 
        available: true, 
        message: "رقم الهاتف الحالي" 
      });
    }

    // Check if phone exists in database
    const [rows] = await db.execute(
      "SELECT id FROM users WHERE phone = ? LIMIT 1",
      [phone]
    );

    if (rows.length > 0) {
      return res.status(409).json({ 
        available: false, 
        error: "رقم الهاتف مستخدم بالفعل" 
      });
    }

    res.json({ 
      available: true, 
      message: "رقم الهاتف متاح" 
    });

  } catch (err) {
    console.error("❌ Check phone available error:", err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ 
        error: "البريد الإلكتروني وكلمة المرور الجديدة مطلوبان" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" 
      });
    }

    // Check if user exists
    const [rows] = await db.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "البريد الإلكتروني غير مسجل" });
    }

    // Hash the new password before storing
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await db.execute(
      "UPDATE users SET password_hash = ? WHERE email = ?",
      [hashedPassword, email]
    );

    console.log(`✅ Password reset for: ${email}`);

    res.json({ 
      success: true, 
      message: "تم تغيير كلمة المرور بنجاح" 
    });

  } catch (err) {
    console.error("❌ Reset password error:", err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

module.exports = router;
