const express = require('express');
const router = express.Router();
const db = require('../db');
const notificationsController = require('../controllers/notifications.controller');

// GET /api/requests - Filter by restaurant_email, charity_email, or no filter for admin
router.get('/', async (req, res) => {
  try {
    const { restaurant_email, charity_email } = req.query;

    let sql = `
      SELECT 
        r.*,
        rest.name AS restaurant_name,
        ch.name AS charity_name
      FROM requests r
      LEFT JOIN users rest ON r.restaurant_email = rest.email
      LEFT JOIN users ch ON r.charity_email = ch.email
    `;
    let params = [];

    // If filter exists, add it
    if (restaurant_email || charity_email) {
      sql += ' WHERE ';
      
      if (restaurant_email) {
        sql += 'r.restaurant_email = ?';
        params.push(restaurant_email);
      }

      if (charity_email) {
        sql += (params.length ? ' AND ' : '') + 'r.charity_email = ?';
        params.push(charity_email);
      }
    }

    sql += ' ORDER BY r.created_at DESC';

    const [rows] = await db.execute(sql, params);
    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});


// POST /api/requests - Send pickup request
router.post('/', async (req, res) => {
  try {
    const {
      surplus_id,
      restaurant_id,
      restaurant_email,
      charity_id,
      charity_email,
      title,
      status
    } = req.body;

    // 1️⃣ Validate input fields
    if (
      !surplus_id ||
      !restaurant_id ||
      !restaurant_email ||
      !charity_id ||
      !charity_email ||
      !title
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get charity name for notification
    let charityName = 'جمعية خيرية';
    try {
      const [charityRows] = await db.execute('SELECT name FROM users WHERE email = ?', [charity_email]);
      if (charityRows.length > 0) charityName = charityRows[0].name;
    } catch (e) { /* ignore */ }

    // 2️⃣ Insert pickup request
    const sql = `
      INSERT INTO requests
      (surplus_id, restaurant_id, charity_id, restaurant_email, charity_email, title, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
      surplus_id,
      restaurant_id,
      charity_id,
      restaurant_email,
      charity_email,
      title,
      status || 'pending'
    ]);

    const requestId = result.insertId;

    // 3️⃣ Create notification for food organization (by email)
    try {
      await notificationsController.createNotificationDirect({
        receiver_type: 'user',
        receiver_id: null,
        receiver_role: restaurant_email, // استخدام email كمعرف
        sender_id: charity_id,
        type: 'request.created',
        title: 'طلب استلام جديد',
        message: `أرسلت ${charityName} طلب استلام للفائض: ${title}`,
        action_url: `/requests/${requestId}`,
        meta: JSON.stringify({
          surplus_id,
          request_id: requestId,
          charity_email
        })
      });
      console.log('✅ Notification sent to restaurant:', restaurant_email);
    } catch (err) {
      console.error('⚠️ Non-fatal: failed to create request notification', err);
    }

    // 4️⃣ Final response
    res.status(201).json({
      message: 'Request created successfully',
      request_id: requestId
    });

  } catch (err) {
    console.error('❌ Create request error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// PUT /api/requests/:id - Accept/Reject request
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // 1️⃣ Fetch request data first for notification
    const [requestRows] = await db.execute('SELECT * FROM requests WHERE id = ?', [id]);
    if (requestRows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    const request = requestRows[0];

    // 2️⃣ Get restaurant name for notification
    let restaurantName = 'المؤسسة';
    try {
      const [restRows] = await db.execute('SELECT name FROM users WHERE email = ?', [request.restaurant_email]);
      if (restRows.length > 0) restaurantName = restRows[0].name;
    } catch (e) { /* ignore */ }

    // 3️⃣ Update request status
    const [result] = await db.execute(
      'UPDATE requests SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // 4️⃣ If accepted: reject other requests on same surplus and notify them
    if (status === 'accepted') {
      // Fetch other requests that will be rejected
      const [otherRequests] = await db.execute(
        'SELECT id, charity_email, title FROM requests WHERE surplus_id = ? AND id != ? AND status = ?',
        [request.surplus_id, id, 'pending']
      );
      
      // Reject all other requests on same surplus
      await db.execute(
        'UPDATE requests SET status = ? WHERE surplus_id = ? AND id != ?',
        ['rejected', request.surplus_id, id]
      );
      console.log('✅ Other requests rejected for surplus:', request.surplus_id);
      
      // 5️⃣ Send notifications to auto-rejected charities
      for (const otherReq of otherRequests) {
        try {
          await notificationsController.createNotificationDirect({
            receiver_type: 'user',
            receiver_id: null,
            receiver_role: otherReq.charity_email,
            sender_id: null,
            type: 'request.rejected',
            title: 'تم رفض طلبك تلقائياً',
            message: `تم رفض طلب استلام الفائض "${otherReq.title}" لأن جمعية أخرى قامت باستلامه قبلك.`,
            action_url: `/requests/${otherReq.id}`,
            meta: JSON.stringify({
              request_id: otherReq.id,
              surplus_id: request.surplus_id,
              auto_rejected: true,
              reason: 'claimed_by_other_charity'
            })
          });
          console.log('✅ Auto-reject notification sent to:', otherReq.charity_email);
        } catch (err) {
          console.error('⚠️ Failed to send auto-reject notification:', err);
        }
      }
    }

    // 4️⃣ Create notification for the charity
    try {
      const isAccepted = status === 'accepted';
      await notificationsController.createNotificationDirect({
        receiver_type: 'user',
        receiver_id: null,
        receiver_role: request.charity_email, // استخدام email كمعرف
        sender_id: null,
        type: isAccepted ? 'request.accepted' : 'request.rejected',
        title: isAccepted ? 'تم قبول طلبك! ✓' : 'تم رفض طلبك',
        message: isAccepted 
          ? `قامت ${restaurantName} بقبول طلب استلام الفائض: ${request.title}`
          : `قامت ${restaurantName} برفض طلب استلام الفائض: ${request.title}`,
        action_url: `/requests/${id}`,
        meta: JSON.stringify({
          request_id: id,
          surplus_id: request.surplus_id,
          restaurant_email: request.restaurant_email
        })
      });
      console.log(`✅ ${status} notification sent to charity:`, request.charity_email);
    } catch (err) {
      console.error('⚠️ Non-fatal: failed to create accept/reject notification', err);
    }

    res.json({ message: 'Request updated successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});





// POST /api/requests/cleanup-old - Delete old accepted/rejected requests (older than 7 days)
router.post('/cleanup-old', async (req, res) => {
  try {
    const sql = `
      DELETE FROM requests 
      WHERE status IN ('accepted', 'rejected') 
      AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;
    
    const [result] = await db.execute(sql);
    
    if (result.affectedRows > 0) {
      console.log(`🗑️ Cleaned up ${result.affectedRows} old request(s)`);
    }
    
    res.json({ 
      message: 'Cleanup completed',
      deleted: result.affectedRows 
    });
  } catch (err) {
    console.error('❌ Cleanup old requests error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
