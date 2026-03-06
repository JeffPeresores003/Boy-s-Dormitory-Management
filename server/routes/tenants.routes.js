// Server/routes/tenants.routes.js
const express = require('express');
const pool = require('../config/config');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// ---------------- Get All Tenants ---------------- //
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', type = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push("(t.firstName LIKE ? OR t.lastName LIKE ? OR t.tenantNumber LIKE ? OR t.email LIKE ?)");;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (status) {
      whereConditions.push("t.status = ?");
      params.push(status);
    }

    if (type) {
      whereConditions.push("t.type = ?");
      params.push(type);
    }

    const whereClause = whereConditions.length > 0 ? "WHERE " + whereConditions.join(" AND ") : "";

    // Get total count
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM Tenants t ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // Get paginated tenants with room info
    const [tenants] = await pool.execute(
      `SELECT t.*, r.id as roomPk, r.roomNumber, r.floor as roomFloor
       FROM Tenants t
       LEFT JOIN Rooms r ON t.roomId = r.id
       ${whereClause}
       ORDER BY t.createdAt DESC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );

    // Format response
    const formattedTenants = tenants.map(t => ({
      ...t,
      room: t.roomNumber ? { id: t.roomPk, roomNumber: t.roomNumber, floor: t.roomFloor } : null,
    }));

    res.json({
      tenants: formattedTenants,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Get tenants error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ---------------- Get Single Tenant ---------------- //
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT t.*, r.roomNumber, r.floor as roomFloor
       FROM Tenants t
       LEFT JOIN Rooms r ON t.roomId = r.id
       WHERE t.id = ?`,
      [req.params.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const tenant = rows[0];
    tenant.room = tenant.roomNumber ? { id: tenant.roomId, roomNumber: tenant.roomNumber, floor: tenant.roomFloor } : null;

    res.json(tenant);
  } catch (error) {
    console.error("Get tenant error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper to update room status based on occupancy
const updateRoomStatus = async (roomId) => {
  if (!roomId) return;
  const [roomRows] = await pool.execute("SELECT capacity FROM Rooms WHERE id = ?", [roomId]);
  if (!roomRows.length) return;
  const capacity = roomRows[0].capacity;
  const [countRows] = await pool.execute("SELECT COUNT(*) as count FROM Tenants WHERE roomId = ? AND status = 'active'", [roomId]);
  const occupants = countRows[0].count;
  const newStatus = occupants >= capacity ? 'full' : 'available';
  await pool.execute("UPDATE Rooms SET status = ?, updatedAt = NOW() WHERE id = ?", [newStatus, roomId]);
};

// ---------------- Create Tenant ---------------- //
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, contact, type, department, roomId, guardianName, guardianContact } = req.body;

    if (!firstName || !lastName || !email || !contact || !type || !roomId) {
      return res.status(400).json({ message: 'First name, last name, email, contact, type, and room are required' });
    }

    if (!['student', 'staff', 'faculty'].includes(type)) {
      return res.status(400).json({ message: 'Type must be student, staff, or faculty' });
    }

    // Verify room exists and has space
    const [roomRows] = await pool.execute("SELECT id, capacity, status FROM Rooms WHERE id = ?", [roomId]);
    if (!roomRows.length) {
      return res.status(400).json({ message: 'Selected room does not exist' });
    }
    const room = roomRows[0];
    const [occupantCount] = await pool.execute("SELECT COUNT(*) as count FROM Tenants WHERE roomId = ? AND status = 'active'", [roomId]);
    if (occupantCount[0].count >= room.capacity) {
      return res.status(400).json({ message: 'Selected room is already full' });
    }

    // Check if email already exists
    const [existing] = await pool.execute(
      "SELECT id FROM Tenants WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Auto-generate tenantNumber (TN-0001, TN-0002, ...)
    const [lastTenant] = await pool.execute("SELECT tenantNumber FROM Tenants ORDER BY id DESC LIMIT 1");
    let nextNum = 1;
    if (lastTenant.length > 0 && lastTenant[0].tenantNumber) {
      const match = lastTenant[0].tenantNumber.match(/TN-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const tenantNumber = `TN-${String(nextNum).padStart(4, '0')}`;

    const [result] = await pool.execute(
      `INSERT INTO Tenants (tenantNumber, firstName, lastName, email, contact, type, department, roomId, guardianName, guardianContact, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [tenantNumber, firstName, lastName, email, contact, type, department || null, roomId, guardianName || null, guardianContact || null]
    );

    // Update room status
    await updateRoomStatus(roomId);

    const [newTenant] = await pool.execute(
      `SELECT t.*, r.roomNumber, r.floor as roomFloor
       FROM Tenants t LEFT JOIN Rooms r ON t.roomId = r.id WHERE t.id = ?`,
      [result.insertId]
    );
    const tenant = newTenant[0];
    tenant.room = tenant.roomNumber ? { id: tenant.roomId, roomNumber: tenant.roomNumber, floor: tenant.roomFloor } : null;
    res.status(201).json(tenant);
  } catch (error) {
    console.error("Create tenant error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ---------------- Update Tenant ---------------- //
router.put("/:id", async (req, res) => {
  try {
    const [existing] = await pool.execute("SELECT * FROM Tenants WHERE id = ?", [req.params.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const tenant = existing[0];
    const { firstName, lastName, email, contact, type, department, roomId, guardianName, guardianContact, status } = req.body;

    const oldRoomId = tenant.roomId;
    const newRoomId = roomId !== undefined ? (roomId || null) : tenant.roomId;

    // If changing room, verify new room has space
    if (newRoomId && newRoomId !== oldRoomId) {
      const [roomRows] = await pool.execute("SELECT id, capacity FROM Rooms WHERE id = ?", [newRoomId]);
      if (!roomRows.length) {
        return res.status(400).json({ message: 'Selected room does not exist' });
      }
      const [occupantCount] = await pool.execute("SELECT COUNT(*) as count FROM Tenants WHERE roomId = ? AND status = 'active'", [newRoomId]);
      if (occupantCount[0].count >= roomRows[0].capacity) {
        return res.status(400).json({ message: 'Selected room is already full' });
      }
    }

    await pool.execute(
      `UPDATE Tenants SET
        firstName = ?, lastName = ?, email = ?, contact = ?, type = ?,
        department = ?, roomId = ?, guardianName = ?, guardianContact = ?,
        status = ?, updatedAt = NOW()
       WHERE id = ?`,
      [
        firstName ?? tenant.firstName,
        lastName ?? tenant.lastName,
        email ?? tenant.email,
        contact ?? tenant.contact,
        type ?? tenant.type,
        department !== undefined ? (department || null) : tenant.department,
        newRoomId,
        guardianName !== undefined ? (guardianName || null) : tenant.guardianName,
        guardianContact !== undefined ? (guardianContact || null) : tenant.guardianContact,
        status ?? tenant.status,
        req.params.id,
      ]
    );

    // Update room statuses if room changed
    if (oldRoomId !== newRoomId) {
      await updateRoomStatus(oldRoomId);
      await updateRoomStatus(newRoomId);
    }

    const [updated] = await pool.execute(
      `SELECT t.*, r.roomNumber, r.floor as roomFloor
       FROM Tenants t LEFT JOIN Rooms r ON t.roomId = r.id WHERE t.id = ?`,
      [req.params.id]
    );
    const result = updated[0];
    result.room = result.roomNumber ? { id: result.roomId, roomNumber: result.roomNumber, floor: result.roomFloor } : null;
    res.json(result);
  } catch (error) {
    console.error("Update tenant error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ---------------- Archive Tenant ---------------- //
router.put("/:id/archive", async (req, res) => {
  try {
    const [existing] = await pool.execute("SELECT * FROM Tenants WHERE id = ?", [req.params.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const tenant = existing[0];
    const oldRoomId = tenant.roomId;

    // Archive tenant and remove from room
    await pool.execute(
      "UPDATE Tenants SET status = 'archived', roomId = NULL, updatedAt = NOW() WHERE id = ?",
      [req.params.id]
    );

    // Update old room status
    if (oldRoomId) {
      const [occupantCount] = await pool.execute(
        "SELECT COUNT(*) as count FROM Tenants WHERE roomId = ? AND status = 'active'",
        [oldRoomId]
      );
      const [roomInfo] = await pool.execute("SELECT capacity FROM Rooms WHERE id = ?", [oldRoomId]);
      if (roomInfo.length > 0) {
        const newStatus = occupantCount[0].count === 0 ? 'available' :
                          occupantCount[0].count >= roomInfo[0].capacity ? 'full' : 'available';
        await pool.execute("UPDATE Rooms SET status = ?, updatedAt = NOW() WHERE id = ?", [newStatus, oldRoomId]);
      }
    }

    res.json({ message: 'Tenant archived successfully' });
  } catch (error) {
    console.error("Archive tenant error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
