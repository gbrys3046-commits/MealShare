const bcrypt = require("bcrypt");
const db = require("../../db"); 
const transporter = require("./mailer");
const generateOTP = require("./otpGenerator");

// Send OTP
exports.sendOTP = async (req, res) => {
  const { email, purpose = "signup" } = req.body;

  if (!email) {
    return res.status(400).json({ message: "البريد الإلكتروني مطلوب" });
  }

  try {
    // Generate OTP
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    // Save to database
    await db.execute(
      `INSERT INTO auth_otps 
       (email, otp_hash, purpose, expires_at) 
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
      [email, otpHash, purpose]
    );

    // Send email
    const mailOptions = {
      from: `"MealShare" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "رمز التحقق OTP - MealShare",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; direction: rtl; text-align: center; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px;">
          <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
            <h1 style="color: #667eea; margin-bottom: 10px;">🍽️ MealShare</h1>
            <p style="color: #666; margin-bottom: 30px;">منصة مشاركة الطعام</p>
            
            <h2 style="color: #333; margin-bottom: 20px;">رمز التحقق الخاص بك:</h2>
            
            <div style="background: linear-gradient(135deg, #00c4a7 0%, #00a896 100%); padding: 25px 40px; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: white; border-radius: 10px; display: inline-block; margin: 20px 0;">
              ${otp}
            </div>
            
            <p style="color: #888; margin-top: 30px; font-size: 14px;">
              ⏰ هذا الرمز صالح لمدة <strong>5 دقائق</strong> فقط
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #aaa; font-size: 12px;">
              إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ OTP sent successfully to: ${email}`);
    console.log(`   OTP Code: ${otp} (for debugging only)`);
    
    res.json({ message: "تم إرسال رمز التحقق بنجاح" });
    
  } catch (err) {
    console.error('❌ OTP Error:', err);
    console.error('   Full error:', JSON.stringify(err, null, 2));
    
    // Detailed error message based on error type
    if (err.message && (err.message.includes('535') || err.message.includes('Username and Password'))) {
      return res.status(500).json({ 
        message: "فشل إرسال OTP - مشكلة في إعدادات البريد"
      });
    }
    
    // Database error
    if (err.code === 'ER_NO_SUCH_TABLE') {
      console.error('❌ Table auth_otps does not exist!');
      return res.status(500).json({ 
        message: "جدول OTP غير موجود في قاعدة البيانات"
      });
    }
    
    res.status(500).json({ 
      message: "فشل إرسال رمز التحقق",
      error: err.message || 'Unknown error'
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  const { email, otp, purpose = "signup" } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "البريد ورمز التحقق مطلوبان" });
  }

  try {
    const [rows] = await db.execute(
      `SELECT * FROM auth_otps
       WHERE email = ?
       AND purpose = ?
       AND is_used = 0
       AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, purpose]
    );

    if (!rows.length) {
      return res.status(400).json({ message: "رمز التحقق منتهي الصلاحية أو غير موجود" });
    }

    const isValid = await bcrypt.compare(otp, rows[0].otp_hash);

    if (!isValid) {
      return res.status(400).json({ message: "رمز التحقق غير صحيح" });
    }

    // Mark OTP as used
    await db.execute(
      "UPDATE auth_otps SET is_used = 1 WHERE id = ?",
      [rows[0].id]
    );

    console.log(`✅ OTP verified for: ${email}`);
    res.json({ message: "تم التحقق بنجاح ✅", verified: true });
    
  } catch (err) {
    console.error('❌ Verify Error:', err.message);
    res.status(500).json({ message: "فشل التحقق من الرمز" });
  }
};