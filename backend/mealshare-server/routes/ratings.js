const express = require("express");
const router = express.Router();
const db = require("../db");

/*
POST /api/ratings
Add new rating
*/
router.post("/", async (req, res) => {
  try {
    const {
      request_id,
      surplus_id,
      restaurant_email,
      charity_email,
      staff_behavior_rating,
      timeliness_rating,
      packaging_rating,
      comment
    } = req.body;

    // Validate required fields
    if (
      !request_id ||
      !surplus_id ||
      !restaurant_email ||
      !charity_email
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = `
      INSERT INTO ratings
      (
        request_id,
        surplus_id,
        restaurant_email,
        charity_email,
        staff_behavior_rating,
        timeliness_rating,
        packaging_rating,
        comment
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.execute(sql, [
      request_id,
      surplus_id,
      restaurant_email,
      charity_email,
      staff_behavior_rating || null,
      timeliness_rating || null,
      packaging_rating || null,
      comment || ""
    ]);

    res.status(201).json({ message: "Rating created successfully" });

  } catch (err) {
    console.error("❌ Rating insert error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/*
GET /api/ratings/restaurant/:email
Get ratings for specific restaurant
*/
router.get("/restaurant/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const [rows] = await db.execute(
      `
      SELECT
        r.id,
        r.request_id,
        r.surplus_id,
        r.charity_email,
        u.name AS charity_name,
        r.staff_behavior_rating,
        r.timeliness_rating,
        r.packaging_rating,
        r.comment,
        r.created_at
      FROM ratings r
      LEFT JOIN users u ON r.charity_email = u.email
      WHERE r.restaurant_email = ?
      ORDER BY r.created_at DESC
      `,
      [email]
    );

    res.json(rows);

  } catch (err) {
    console.error("❌ Fetch ratings error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/*
GET /api/ratings/restaurant/:email/avg
Average ratings for restaurant
*/
router.get("/restaurant/:email/avg", async (req, res) => {
  try {
    const { email } = req.params;

    const [rows] = await db.execute(
      `
      SELECT
        ROUND(AVG(staff_behavior_rating), 2) AS staff_behavior_avg,
        ROUND(AVG(timeliness_rating), 2) AS timeliness_avg,
        ROUND(AVG(packaging_rating), 2) AS packaging_avg,
        COUNT(*) AS total_ratings
      FROM ratings
      WHERE restaurant_email = ?
      `,
      [email]
    );

    res.json(rows[0]);

  } catch (err) {
    console.error("❌ Avg ratings error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/*
GET /api/ratings/check/:request_id
Check if rating exists for specific request
*/
router.get("/check/:request_id", async (req, res) => {
  try {
    const { request_id } = req.params;

    const [rows] = await db.execute(
      `SELECT id FROM ratings WHERE request_id = ? LIMIT 1`,
      [request_id]
    );

    res.json({ 
      hasRating: rows.length > 0,
      ratingId: rows.length > 0 ? rows[0].id : null
    });

  } catch (err) {
    console.error("❌ Check rating error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
