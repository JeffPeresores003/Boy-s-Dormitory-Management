// Server/routes/payments.routes.js
const express = require('express');
const pool = require('../config/config');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// ---------------- Get All Payments ---------------- //
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', semester = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereConditions = [];
    let params = [];

    if (status) {
      whereConditions.push("p.status = ?");
      params.push(status);
    }
    if (semester) {
      whereConditions.push("p.semester = ?");
      params.push(semester);
    }
    if (search) {
      whereConditions.push("(t.firstName LIKE ? OR t.lastName LIKE ? OR t.tenantNumber LIKE ?)");;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    const whereClause = whereConditions.length > 0 ? "WHERE " + whereConditions.join(" AND ") : "";

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM Payments p LEFT JOIN Tenants t ON p.tenantId = t.id ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const [payments] = await pool.execute(
      `SELECT p.*, t.id as tenantPk, t.firstName, t.lastName, t.tenantNumber, t.type as tenantType
       FROM Payments p
       LEFT JOIN Tenants t ON p.tenantId = t.id
       ${whereClause}
       ORDER BY p.dueDate DESC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );

    const formattedPayments = payments.map(p => ({
      id: p.id,
      tenantId: p.tenantId,
      amount: p.amount,
      dueDate: p.dueDate,
      paymentDate: p.paymentDate,
      status: p.status,
      amountPaid: p.amountPaid,
      semester: p.semester,
      description: p.description,
      receiptNumber: p.receiptNumber,
      recordedBy: p.recordedBy,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      tenant: p.tenantPk ? {
        id: p.tenantPk,
        firstName: p.firstName,
        lastName: p.lastName,
        tenantNumber: p.tenantNumber,
        type: p.tenantType,
      } : null,
    }));

    res.json({
      payments: formattedPayments,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ---------------- Get Tenant Payments ---------------- //
router.get("/tenant/:tenantId", async (req, res) => {
  try {
    const [payments] = await pool.execute(
      "SELECT * FROM Payments WHERE tenantId = ? ORDER BY dueDate DESC",
      [req.params.tenantId]
    );
    res.json(payments);
  } catch (error) {
    console.error("Get tenant payments error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ---------------- Create Payment ---------------- //
router.post("/", async (req, res) => {
  try {
    const { tenantId, amount, dueDate, semester, description } = req.body;

    if (!tenantId || !amount || !dueDate || !semester) {
      return res.status(400).json({ message: 'Tenant, amount, due date, and semester are required' });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }

    const [tenantRows] = await pool.execute("SELECT id FROM Tenants WHERE id = ?", [tenantId]);
    if (!tenantRows || tenantRows.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const [result] = await pool.execute(
      `INSERT INTO Payments (tenantId, amount, dueDate, semester, description, recordedBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [tenantId, parseFloat(amount), dueDate, semester, description || 'Monthly Dormitory Fee', req.user.id]
    );

    const [newPayment] = await pool.execute("SELECT * FROM Payments WHERE id = ?", [result.insertId]);
    res.status(201).json(newPayment[0]);
  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ---------------- Record Payment ---------------- //
router.put("/:id/record", async (req, res) => {
  try {
    const [existing] = await pool.execute("SELECT * FROM Payments WHERE id = ?", [req.params.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const payment = existing[0];
    const { amountPaid } = req.body;

    if (!amountPaid || parseFloat(amountPaid) <= 0) {
      return res.status(400).json({ message: 'Amount paid must be positive' });
    }

    const newAmountPaid = parseFloat(payment.amountPaid) + parseFloat(amountPaid);
    const totalAmount = parseFloat(payment.amount);

    let newStatus, finalAmountPaid;
    if (newAmountPaid >= totalAmount) {
      newStatus = 'paid';
      finalAmountPaid = totalAmount;
    } else {
      newStatus = 'partial';
      finalAmountPaid = newAmountPaid;
    }

    const receiptNumber = payment.receiptNumber || `RCP-${Date.now()}-${payment.id}`;

    await pool.execute(
      `UPDATE Payments SET amountPaid = ?, status = ?, paymentDate = CURDATE(), recordedBy = ?, receiptNumber = ?, updatedAt = NOW() WHERE id = ?`,
      [finalAmountPaid, newStatus, req.user.id, receiptNumber, req.params.id]
    );

    const [updated] = await pool.execute("SELECT * FROM Payments WHERE id = ?", [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error("Record payment error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ---------------- Update Payment ---------------- //
router.put("/:id", async (req, res) => {
  try {
    const [existing] = await pool.execute("SELECT * FROM Payments WHERE id = ?", [req.params.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const payment = existing[0];
    const { amount, dueDate, semester, description, status } = req.body;

    await pool.execute(
      `UPDATE Payments SET amount = ?, dueDate = ?, semester = ?, description = ?, status = ?, updatedAt = NOW() WHERE id = ?`,
      [
        amount ?? payment.amount,
        dueDate ?? payment.dueDate,
        semester ?? payment.semester,
        description ?? payment.description,
        status ?? payment.status,
        req.params.id,
      ]
    );

    const [updated] = await pool.execute("SELECT * FROM Payments WHERE id = ?", [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ---------------- Delete Payment ---------------- //
router.delete("/:id", async (req, res) => {
  try {
    const [existing] = await pool.execute("SELECT id FROM Payments WHERE id = ?", [req.params.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    await pool.execute("DELETE FROM Payments WHERE id = ?", [req.params.id]);
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error("Delete payment error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
