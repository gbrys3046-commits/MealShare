const express = require('express');
const router = express.Router();

const db = require('../db');
const notificationsController = require('../controllers/notifications.controller');

console.log("✅surpluses routes file loaded");

// POST /api/surpluses - Create new surplus
router.post('/', async (req, res) => {
  try {
    const {
      restaurant_id,
      restaurant_email,
      title,
      qty,
      expiry_hours,
      expiry_text,
      description,
      status
    } = req.body;

    const sql = `
      INSERT INTO surpluses
      (restaurant_id, restaurant_email, title, qty, expiry_hours, expiry_text, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
      restaurant_id,
      restaurant_email,
      title,
      qty,
      expiry_hours,
      expiry_text,
      description,
      status
    ]);

    const surplusId = result.insertId;

    // Create notification for restaurant confirming surplus publish
    try {
      await notificationsController.createNotificationDirect({
        receiver_type: 'user',
        receiver_id: null,
        receiver_role: restaurant_email,
        sender_id: null,
        type: 'surplus.created',
        title: 'تم نشر الفائض بنجاح ✓',
        message: `تم نشر "${title}" - الكمية: ${qty}، الصلاحية: ${expiry_hours} ساعة`,
        action_url: `/surpluses/${surplusId}`,
        meta: JSON.stringify({
          surplus_id: surplusId,
          title,
          qty
        })
      });
      console.log('✅ Surplus published notification sent to:', restaurant_email);
    } catch (err) {
      console.error('⚠️ Non-fatal: failed to create surplus notification', err);
    }

    res.status(201).json({ 
      message: 'Surplus created successfully',
      surplus_id: surplusId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/surpluses/count-today/:restaurant_id - Count surpluses published in last 24 hours
router.get('/count-today/:restaurant_id', async (req, res) => {
  try {
    const { restaurant_id } = req.params;
    
    const sql = `
      SELECT COUNT(*) as count 
      FROM surpluses 
      WHERE restaurant_id = ? 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;
    
    const [rows] = await db.execute(sql, [restaurant_id]);
    const count = rows[0]?.count || 0;
    
    res.json({ count, limit: 5, remaining: Math.max(0, 5 - count) });
  } catch (err) {
    console.error('❌ Count today error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/surpluses - Fetch all surpluses
// Supports optional parameter: charity_email to show surpluses reserved for this charity only
router.get('/', async (req, res) => {
  try {
    const { charity_email } = req.query;
    
    let sql = `
      SELECT 
        s.*, u.name AS restaurant_name,
        u.address AS location,
        accepted_req.charity_email AS accepted_by_charity
      FROM surpluses s
      LEFT JOIN users u ON s.restaurant_email = u.email
      LEFT JOIN requests accepted_req ON s.id = accepted_req.surplus_id AND accepted_req.status = 'accepted'
      WHERE s.status = 'active'
        AND (
          accepted_req.id IS NULL`;
    
    let params = [];
    
    // If charity email is passed, also show surpluses reserved for them
    if (charity_email) {
      sql += ` OR accepted_req.charity_email = ?`;
      params.push(charity_email);
    }
    
    sql += `) ORDER BY s.created_at DESC`;
    
    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('❌ Fetch surpluses error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// DELETE /api/surpluses/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM surpluses WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Surplus not found' });
    }

    res.json({ message: 'Surplus deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT /api/surpluses/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      qty,
      expiry_hours,
      expiry_text,
      description,
      status
    } = req.body;

    const sql = `
      UPDATE surpluses
      SET
        title = ?,
        qty = ?,
        expiry_hours = ?,
        expiry_text = ?,
        description = ?,
        status = ?
      WHERE id = ?
    `;

    const [result] = await db.execute(sql, [
      title,
      qty,
      expiry_hours,
      expiry_text,
      description,
      status,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Surplus not found' });
    }

    res.json({ message: 'Surplus updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});


/*
POST /api/surpluses/check-expiries
Check and delete expired surpluses
*/
router.post('/check-expiries', async (req, res) => {
  try {
    // Delete expired surpluses directly from database
    const sql = `
      DELETE FROM surpluses 
      WHERE status = 'active' 
      AND created_at < DATE_SUB(NOW(), INTERVAL expiry_hours HOUR)
    `;
    
    const [result] = await db.execute(sql);
    
    if (result.affectedRows > 0) {
      console.log(`🗑️ Deleted ${result.affectedRows} expired surplus(es)`);
    }
    
    res.json({ 
      message: 'Expiry check completed',
      deleted: result.affectedRows 
    });
  } catch (err) {
    console.error('❌ Check expiries error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
