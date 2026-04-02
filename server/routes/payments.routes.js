// Server/routes/payments.routes.js
const express = require('express');
const pool = require('../config/config');
const { protect, authorize } = require('../middleware/authMiddleware');
const { logActivity } = require('../utils/activityLogger');
const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// ---------------- Get Current Payments (active billing cycle) ---------------- //
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereConditions = [];
    let params = [];

    if (status) {
      whereConditions.push("p.status = ?");
      params.push(status);
    }
    if (search) {
      whereConditions.push("(t.firstName LIKE ? OR t.lastName LIKE ? OR t.tenantNumber LIKE ?)");
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
      `SELECT p.id, p.tenantId, p.amount, p.amountPaid, p.status, p.semester,
              p.description, p.receiptNumber, p.paymentMethod, p.recordedBy, p.createdAt, p.updatedAt,
              DATE_FORMAT(p.dueDate, '%Y-%m-%d') AS dueDate,
              DATE_FORMAT(p.paymentDate, '%Y-%m-%d') AS paymentDate,
              t.id as tenantPk, t.firstName, t.lastName, t.tenantNumber, t.type as tenantType
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
      paymentMethod: p.paymentMethod,
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
      `SELECT id, tenantId, amount, amountPaid, status, semester, description, receiptNumber,
              paymentMethod, recordedBy, createdAt, updatedAt,
              DATE_FORMAT(dueDate, '%Y-%m-%d') AS dueDate,
              DATE_FORMAT(paymentDate, '%Y-%m-%d') AS paymentDate
       FROM Payments WHERE tenantId = ? ORDER BY dueDate DESC`,
      [req.params.tenantId]
    );
    res.json(payments);
  } catch (error) {
    console.error("Get tenant payments error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ---------------- Get Payment Records (current cycle + historical archive) ---------------- //
router.get("/records", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', month = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereConditions = [];
    let params = [];

    if (status) {
      whereConditions.push("r.status = ?");
      params.push(status);
    }
    if (month) {
      const [filterYear, filterMonth] = month.split('-');
      whereConditions.push("YEAR(r.dueDate) = ? AND MONTH(r.dueDate) = ?");
      params.push(parseInt(filterYear), parseInt(filterMonth));
    }
    if (search) {
      whereConditions.push("(r.firstName LIKE ? OR r.lastName LIKE ? OR r.tenantNumber LIKE ?)");
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // UNION current Payments (active cycle) + PaymentRecords (archived) so all history is visible
    const unionSubquery = `(
      SELECT pr.id, pr.tenantId, pr.amount, pr.amountPaid, pr.billingMonth,
             DATE_FORMAT(pr.dueDate, '%Y-%m-%d') AS dueDate,
             DATE_FORMAT(pr.paymentDate, '%Y-%m-%d') AS paymentDate,
            pr.status, pr.semester, pr.description, pr.receiptNumber, pr.paymentMethod,
             DATE_FORMAT(pr.archivedAt, '%Y-%m-%d') AS archivedAt, 'archived' AS source,
             t.id AS tenantPk, t.firstName, t.lastName, t.tenantNumber
      FROM PaymentRecords pr LEFT JOIN Tenants t ON pr.tenantId = t.id
      UNION ALL
      SELECT p.id, p.tenantId, p.amount, p.amountPaid,
             DATE_FORMAT(p.dueDate, '%Y-%m') AS billingMonth,
             DATE_FORMAT(p.dueDate, '%Y-%m-%d') AS dueDate,
             DATE_FORMAT(p.paymentDate, '%Y-%m-%d') AS paymentDate,
            p.status, p.semester, p.description, p.receiptNumber, p.paymentMethod,
             NULL AS archivedAt, 'current' AS source,
             t.id AS tenantPk, t.firstName, t.lastName, t.tenantNumber
      FROM Payments p LEFT JOIN Tenants t ON p.tenantId = t.id
    )`;

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM ${unionSubquery} r ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const [records] = await pool.query(
      `SELECT r.* FROM ${unionSubquery} r
       ${whereClause}
       ORDER BY r.dueDate DESC, r.lastName ASC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );

    const formatted = records.map(r => ({
      id: r.id,
      tenantId: r.tenantId,
      amount: r.amount,
      amountPaid: r.amountPaid,
      billingMonth: r.billingMonth,
      dueDate: r.dueDate,
      paymentDate: r.paymentDate,
      status: r.status,
      semester: r.semester,
      description: r.description,
      receiptNumber: r.receiptNumber,
      paymentMethod: r.paymentMethod,
      archivedAt: r.archivedAt,
      source: r.source,
      tenant: r.tenantPk ? {
        id: r.tenantPk, firstName: r.firstName, lastName: r.lastName, tenantNumber: r.tenantNumber,
      } : null,
    }));

    res.json({ payments: formatted, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error("Get payment records error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ---------------- Mark a Payment Record as Paid ---------------- //
router.put("/records/:id/record", async (req, res) => {
  try {
    const { amountPaid, source, receiptNumber } = req.body;
    if (!amountPaid || parseFloat(amountPaid) <= 0) return res.status(400).json({ message: 'Amount paid must be positive' });

    // source='current' means the record lives in Payments (active cycle); 'archived' → PaymentRecords
    const isCurrent = source === 'current';
    const table = isCurrent ? 'Payments' : 'PaymentRecords';

    const [existing] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Payment record not found' });

    const payment = existing[0];
    const newAmountPaid = parseFloat(payment.amountPaid) + parseFloat(amountPaid);
    const totalAmount = parseFloat(payment.amount);
    const finalAmountPaid = newAmountPaid >= totalAmount ? totalAmount : newAmountPaid;
    const newStatus = newAmountPaid >= totalAmount ? 'paid' : 'partial';
    const typedReceiptNumber = typeof receiptNumber === 'string' ? receiptNumber.trim() : '';
    const finalReceiptNumber = typedReceiptNumber || payment.receiptNumber || `RCP-${Date.now()}-${isCurrent ? 'P' : 'PR'}${payment.id}`;

    if (typedReceiptNumber && typedReceiptNumber !== payment.receiptNumber) {
      const [duplicate] = await pool.execute(
        `SELECT id FROM ${table} WHERE receiptNumber = ? AND id <> ? LIMIT 1`,
        [typedReceiptNumber, req.params.id]
      );
      if (duplicate.length > 0) {
        return res.status(400).json({ message: 'Receipt number already exists in this payment table' });
      }
    }

    await pool.execute(
      `UPDATE ${table} SET amountPaid = ?, status = ?, paymentDate = CURDATE(), recordedBy = ?, receiptNumber = ?, updatedAt = NOW() WHERE id = ?`,
      [finalAmountPaid, newStatus, req.user.id, finalReceiptNumber, req.params.id]
    );

    await logActivity({
      category: 'payment',
      entityType: 'payment',
      entityId: Number(req.params.id),
      actionType: 'payment_recorded',
      title: `Payment recorded (${isCurrent ? 'current' : 'archived'} record)`,
      details: `Amount paid: ${amountPaid}. New status: ${newStatus}.`,
      paymentId: Number(req.params.id),
      performedBy: req.user.id,
    });

    const [updated] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error("Record payment (archive) error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ---------------- Create Monthly Billing Batch ---------------- //
// Archives the entire current Payments table into PaymentRecords,
// then creates fresh unpaid records for every active tenant.
router.post("/create-batch", async (req, res) => {
  try {
    const { year, month, defaultAmount, semester } = req.body;
    if (!year || !month) return res.status(400).json({ message: 'year and month are required' });

    const y = parseInt(year);
    const m = parseInt(month);
    const lastDay = new Date(y, m, 0).getDate();
    const dueDate = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;
    const billingMonth = `${y}-${String(m).padStart(2, '0')}`;
    const parsedDefaultAmount = defaultAmount !== undefined && defaultAmount !== null && defaultAmount !== ''
      ? parseFloat(defaultAmount)
      : null;

    if (parsedDefaultAmount !== null && Number.isNaN(parsedDefaultAmount)) {
      return res.status(400).json({ message: 'Default room payment must be a valid number' });
    }

    if (parsedDefaultAmount !== null && parsedDefaultAmount <= 0) {
      return res.status(400).json({ message: 'Default room payment must be greater than 0' });
    }

    // 1. Snapshot current Payments so we know each tenant's amount
    const [currentPayments] = await pool.execute('SELECT * FROM Payments');
    const amountMap = {};
    currentPayments.forEach(p => { amountMap[p.tenantId] = p.amount; });

    // 2. Archive current Payments → PaymentRecords
    for (const p of currentPayments) {
      const d = p.dueDate ? new Date(p.dueDate) : null;
      const archiveMonth = (d && !isNaN(d))
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : billingMonth;
      await pool.execute(
        `INSERT INTO PaymentRecords
         (tenantId, amount, amountPaid, billingMonth, dueDate, paymentDate, status, description, semester, paymentMethod, receiptNumber, recordedBy, createdAt, updatedAt, archivedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [p.tenantId, p.amount, p.amountPaid,
         archiveMonth, p.dueDate, p.paymentDate, p.status,
         p.description || 'Monthly Dormitory Fee', p.semester || '',
         p.paymentMethod || 'cash', p.receiptNumber,
         p.recordedBy, p.createdAt, p.updatedAt]
      );
    }

    // 3. Delete all current Payments (clean slate)
    await pool.execute('DELETE FROM Payments');

    // 4. Create fresh unpaid records for every active tenant
    const [tenants] = await pool.execute("SELECT id FROM Tenants WHERE status = 'active'");
    let created = 0;
    for (const tenant of tenants) {
      let amount = amountMap[tenant.id];
      if (!amount) {
        // Fall back to PaymentRecords history
        const [lastRecord] = await pool.execute(
          'SELECT amount FROM PaymentRecords WHERE tenantId = ? ORDER BY archivedAt DESC LIMIT 1',
          [tenant.id]
        );
        if (lastRecord.length) {
          amount = lastRecord[0].amount;
        } else if (parsedDefaultAmount !== null) {
          amount = parsedDefaultAmount;
        } else {
          continue; // No payment history and no default amount provided
        }
      }
      const [result] = await pool.execute(
        `INSERT INTO Payments (tenantId, amount, dueDate, semester, description, paymentMethod, recordedBy, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 'Monthly Dormitory Fee', 'cash', ?, NOW(), NOW())`,
        [tenant.id, amount, dueDate, semester || '', req.user.id]
      );
      const receiptNumber = `RCP-${Date.now()}-${result.insertId}`;
      await pool.execute('UPDATE Payments SET receiptNumber = ? WHERE id = ?', [receiptNumber, result.insertId]);
      created++;
    }

    await logActivity({
      category: 'payment',
      entityType: 'payment',
      entityId: null,
      actionType: 'payment_batch_created',
      title: `Billing batch created for ${billingMonth}`,
      details: `${created} payment record(s) generated.`,
      performedBy: req.user.id,
    });

    res.json({ created, month: billingMonth });
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ---------------- Create Payment ---------------- //
router.post("/", async (req, res) => {
  try {
    const { tenantId, amount, dueDate, semester, description, paymentMethod } = req.body;

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
      `INSERT INTO Payments (tenantId, amount, dueDate, semester, description, paymentMethod, recordedBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [tenantId, parseFloat(amount), dueDate, semester || '', description || 'Monthly Dormitory Fee', paymentMethod || 'cash', req.user.id]
    );

    const receiptNumber = `RCP-${Date.now()}-${result.insertId}`;
    await pool.execute("UPDATE Payments SET receiptNumber = ? WHERE id = ?", [receiptNumber, result.insertId]);

    await logActivity({
      category: 'payment',
      entityType: 'payment',
      entityId: result.insertId,
      actionType: 'payment_created',
      title: `Payment created for tenant ${tenantId}`,
      details: `Amount: ${parseFloat(amount)} | Due date: ${dueDate}`,
      tenantId: Number(tenantId),
      paymentId: result.insertId,
      performedBy: req.user.id,
    });

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
    const { amountPaid, receiptNumber } = req.body;

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

    const typedReceiptNumber = typeof receiptNumber === 'string' ? receiptNumber.trim() : '';
    const finalReceiptNumber = typedReceiptNumber || payment.receiptNumber || `RCP-${Date.now()}-${payment.id}`;

    if (typedReceiptNumber && typedReceiptNumber !== payment.receiptNumber) {
      const [duplicate] = await pool.execute(
        'SELECT id FROM Payments WHERE receiptNumber = ? AND id <> ? LIMIT 1',
        [typedReceiptNumber, req.params.id]
      );
      if (duplicate.length > 0) {
        return res.status(400).json({ message: 'Receipt number already exists' });
      }
    }

    await pool.execute(
      `UPDATE Payments SET amountPaid = ?, status = ?, paymentDate = CURDATE(), recordedBy = ?, receiptNumber = ?, updatedAt = NOW() WHERE id = ?`,
      [finalAmountPaid, newStatus, req.user.id, finalReceiptNumber, req.params.id]
    );

    await logActivity({
      category: 'payment',
      entityType: 'payment',
      entityId: payment.id,
      actionType: 'payment_recorded',
      title: `Payment recorded for tenant ${payment.tenantId}`,
      details: `Amount paid: ${amountPaid}. New status: ${newStatus}.`,
      tenantId: payment.tenantId,
      paymentId: payment.id,
      performedBy: req.user.id,
    });

    const [updated] = await pool.execute("SELECT * FROM Payments WHERE id = ?", [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error("Record payment error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ---------------- Update Payment Record (current or archived) ---------------- //
router.put("/records/:id", async (req, res) => {
  try {
    const { source, amount, semester } = req.body;
    const isCurrent = source === 'current';
    const table = isCurrent ? 'Payments' : 'PaymentRecords';

    const [existing] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    const payment = existing[0];
    const nextAmount = amount !== undefined ? parseFloat(amount) : parseFloat(payment.amount);
    if (Number.isNaN(nextAmount) || nextAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }
    if (nextAmount < parseFloat(payment.amountPaid)) {
      return res.status(400).json({ message: 'Amount cannot be less than already paid amount' });
    }

    const nextSemester = semester !== undefined
      ? (semester || '')
      : (payment.semester || '');

    let nextStatus = payment.status;
    if (parseFloat(payment.amountPaid) <= 0) {
      nextStatus = 'unpaid';
    } else if (parseFloat(payment.amountPaid) >= nextAmount) {
      nextStatus = 'paid';
    } else {
      nextStatus = 'partial';
    }

    await pool.execute(
      `UPDATE ${table} SET amount = ?, semester = ?, status = ?, updatedAt = NOW() WHERE id = ?`,
      [nextAmount, nextSemester, nextStatus, req.params.id]
    );

    await logActivity({
      category: 'payment',
      entityType: 'payment',
      entityId: Number(req.params.id),
      actionType: 'payment_updated',
      title: `Payment record updated (${isCurrent ? 'current' : 'archived'})`,
      details: `Amount: ${nextAmount} | Status: ${nextStatus}.`,
      paymentId: Number(req.params.id),
      performedBy: req.user.id,
    });

    const [updated] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error("Update payment record error:", error);
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
    const nextAmount = amount !== undefined ? parseFloat(amount) : parseFloat(payment.amount);

    if (Number.isNaN(nextAmount) || nextAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }

    if (nextAmount < parseFloat(payment.amountPaid)) {
      return res.status(400).json({ message: 'Amount cannot be less than already paid amount' });
    }

    const nextStatus = status ?? (
      parseFloat(payment.amountPaid) <= 0
        ? 'unpaid'
        : parseFloat(payment.amountPaid) >= nextAmount
          ? 'paid'
          : 'partial'
    );

    await pool.execute(
      `UPDATE Payments SET amount = ?, dueDate = ?, semester = ?, description = ?, status = ?, updatedAt = NOW() WHERE id = ?`,
      [
        nextAmount,
        dueDate ?? payment.dueDate,
        semester ?? payment.semester,
        description ?? payment.description,
        nextStatus,
        req.params.id,
      ]
    );

    await logActivity({
      category: 'payment',
      entityType: 'payment',
      entityId: Number(req.params.id),
      actionType: 'payment_updated',
      title: `Payment updated for tenant ${payment.tenantId}`,
      details: `Amount: ${nextAmount} | Status: ${nextStatus}.`,
      tenantId: payment.tenantId,
      paymentId: Number(req.params.id),
      performedBy: req.user.id,
    });

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
