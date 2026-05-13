const bcrypt = require("bcrypt");
const db = require("./db");

async function resetAdmin() {
  try {
    const newPassword = "admin123";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const [result] = await db.execute(
      "UPDATE users SET password_hash = ? WHERE email = ?",
      [hashedPassword, "admin@mealshare.local"]
    );

    if (result.affectedRows > 0) {
      console.log("✅ تم إعادة تعيين كلمة مرور الأدمن بنجاح!");
      console.log("📧 البريد: admin@mealshare.local");
      console.log("🔑 كلمة المرور الجديدة: admin123");
    } else {
      console.log("❌ لم يتم العثور على حساب بهذا البريد الإلكتروني ");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ خطأ:", err.message);
    process.exit(1);
  }
}

resetAdmin();
