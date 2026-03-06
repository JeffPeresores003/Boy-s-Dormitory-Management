-- ============================================================
-- BISU Boy's Dormitory Management System - Database Schema
-- Database: bisu_dormitory
-- Admin-only system with Tenant management
-- ============================================================

-- ============================================================
-- TABLE: Users (Admin accounts only)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin') NOT NULL DEFAULT 'admin',
  `resetPasswordToken` VARCHAR(255) DEFAULT NULL,
  `resetPasswordExpire` DATETIME DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: Rooms
-- ============================================================
CREATE TABLE IF NOT EXISTS `Rooms` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `roomNumber` VARCHAR(255) NOT NULL,
  `floor` INT NOT NULL,
  `capacity` INT NOT NULL,
  `type` ENUM('single', 'shared') NOT NULL DEFAULT 'shared',
  `status` ENUM('available', 'full', 'maintenance') NOT NULL DEFAULT 'available',
  `description` TEXT DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rooms_roomNumber` (`roomNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: Tenants (student, staff, faculty)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Tenants` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tenantNumber` VARCHAR(20) NOT NULL,
  `firstName` VARCHAR(255) NOT NULL,
  `lastName` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `contact` VARCHAR(255) NOT NULL,
  `type` ENUM('student', 'staff', 'faculty') NOT NULL DEFAULT 'student',
  `department` VARCHAR(255) DEFAULT NULL,
  `guardianName` VARCHAR(255) DEFAULT NULL,
  `guardianContact` VARCHAR(255) DEFAULT NULL,
  `roomId` INT DEFAULT NULL,
  `status` ENUM('active', 'archived') NOT NULL DEFAULT 'active',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenants_tenantNumber` (`tenantNumber`),
  UNIQUE KEY `uk_tenants_email` (`email`),
  KEY `idx_tenants_roomId` (`roomId`),
  KEY `idx_tenants_status` (`status`),
  KEY `idx_tenants_type` (`type`),
  CONSTRAINT `fk_tenants_roomId` FOREIGN KEY (`roomId`) REFERENCES `Rooms` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: Payments
-- ============================================================
CREATE TABLE IF NOT EXISTS `Payments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tenantId` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `dueDate` DATE NOT NULL,
  `paymentDate` DATE DEFAULT NULL,
  `status` ENUM('paid', 'unpaid', 'partial') NOT NULL DEFAULT 'unpaid',
  `amountPaid` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `semester` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) DEFAULT 'Monthly Dormitory Fee',
  `receiptNumber` VARCHAR(255) DEFAULT NULL,
  `recordedBy` INT DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payments_receiptNumber` (`receiptNumber`),
  KEY `idx_payments_tenantId` (`tenantId`),
  KEY `idx_payments_status` (`status`),
  CONSTRAINT `fk_payments_tenantId` FOREIGN KEY (`tenantId`) REFERENCES `Tenants` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_payments_recordedBy` FOREIGN KEY (`recordedBy`) REFERENCES `Users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: Visitors
-- ============================================================
CREATE TABLE IF NOT EXISTS `Visitors` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `visitorName` VARCHAR(255) NOT NULL,
  `tenantVisitedId` INT NOT NULL,
  `purpose` VARCHAR(255) NOT NULL,
  `timeIn` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `timeOut` DATETIME DEFAULT NULL,
  `recordedBy` INT DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_visitors_tenantVisitedId` (`tenantVisitedId`),
  CONSTRAINT `fk_visitors_tenantVisitedId` FOREIGN KEY (`tenantVisitedId`) REFERENCES `Tenants` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_visitors_recordedBy` FOREIGN KEY (`recordedBy`) REFERENCES `Users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: MaintenanceRequests
-- ============================================================
CREATE TABLE IF NOT EXISTS `MaintenanceRequests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tenantId` INT NOT NULL,
  `roomId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `status` ENUM('pending', 'in-progress', 'resolved') NOT NULL DEFAULT 'pending',
  `adminNotes` TEXT DEFAULT NULL,
  `resolvedAt` DATETIME DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_maintenance_tenantId` (`tenantId`),
  KEY `idx_maintenance_roomId` (`roomId`),
  CONSTRAINT `fk_maintenance_tenantId` FOREIGN KEY (`tenantId`) REFERENCES `Tenants` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_maintenance_roomId` FOREIGN KEY (`roomId`) REFERENCES `Rooms` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: Announcements
-- ============================================================
CREATE TABLE IF NOT EXISTS `Announcements` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `category` ENUM('general', 'emergency', 'events') NOT NULL DEFAULT 'general',
  `postedBy` INT NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_announcements_postedBy` FOREIGN KEY (`postedBy`) REFERENCES `Users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DEFAULT ADMIN ACCOUNT
-- Email: admin@bisu.edu.ph | Password: admin123
-- ============================================================
-- INSERT INTO `Users` (`name`, `email`, `password`, `role`) VALUES
-- ('Administrator', 'admin@bisu.edu.ph', '$2a$12$LJ3dByjCaVcFGMg9X5y8e.9Bz0dYV1Fq0C.yQ5X4jK9WKwXkKXJZq', 'admin');

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

DELIMITER $$

CREATE PROCEDURE `sp_GetDashboardStats`()
BEGIN
  SELECT
    (SELECT COUNT(*) FROM Tenants WHERE status = 'active') AS totalTenants,
    (SELECT COUNT(*) FROM Tenants WHERE status = 'active' AND type = 'student') AS totalStudents,
    (SELECT COUNT(*) FROM Tenants WHERE status = 'active' AND type = 'staff') AS totalStaff,
    (SELECT COUNT(*) FROM Tenants WHERE status = 'active' AND type = 'faculty') AS totalFaculty,
    (SELECT COUNT(*) FROM Rooms) AS totalRooms,
    (SELECT COUNT(*) FROM Rooms WHERE status = 'available') AS availableRooms,
    (SELECT COUNT(*) FROM Rooms WHERE status = 'full') AS fullRooms,
    (SELECT COUNT(*) FROM Rooms WHERE status = 'maintenance') AS maintenanceRooms,
    (SELECT COUNT(*) FROM Payments WHERE status = 'unpaid') AS pendingPayments,
    (SELECT COUNT(*) FROM Payments WHERE status = 'partial') AS partialPayments,
    (SELECT COUNT(*) FROM MaintenanceRequests WHERE status != 'resolved') AS activeRequests,
    (SELECT COUNT(*) FROM Visitors WHERE DATE(timeIn) = CURDATE()) AS todayVisitors,
    (SELECT COALESCE(SUM(amount), 0) FROM Payments) AS totalBilled,
    (SELECT COALESCE(SUM(amountPaid), 0) FROM Payments) AS totalCollected;
END$$

CREATE PROCEDURE `sp_GetTenantsByRoom`(IN p_roomId INT)
BEGIN
  SELECT t.id, t.firstName, t.lastName, t.email, t.contact, t.type, t.tenantNumber
  FROM Tenants t
  WHERE t.roomId = p_roomId AND t.status = 'active'
  ORDER BY t.lastName, t.firstName;
END$$

-- ------------------------------------------------------------
-- SP: GetOccupancyReport
-- Returns room occupancy with current and max capacity
-- ------------------------------------------------------------
CREATE PROCEDURE `sp_GetOccupancyReport`()
BEGIN
  SELECT
    r.id,
    r.roomNumber,
    r.floor,
    r.type,
    r.capacity,
    r.status,
    COUNT(s.id) AS currentOccupancy
  FROM Rooms r
  LEFT JOIN Students s ON s.roomId = r.id AND s.status = 'active'
  GROUP BY r.id
  ORDER BY r.roomNumber;
END$$

-- ------------------------------------------------------------
-- SP: GetPaymentSummary
-- Returns payment summary per semester
-- ------------------------------------------------------------
CREATE PROCEDURE `sp_GetPaymentSummary`(IN p_semester VARCHAR(255))
BEGIN
  SELECT
    p.status,
    COUNT(*) AS totalCount,
    COALESCE(SUM(p.amount), 0) AS totalAmount,
    COALESCE(SUM(p.amountPaid), 0) AS totalPaid,
    COALESCE(SUM(p.amount - p.amountPaid), 0) AS totalBalance
  FROM Payments p
  WHERE (p_semester = '' OR p_semester IS NULL OR p.semester = p_semester)
  GROUP BY p.status;
END$$

-- ------------------------------------------------------------
-- SP: GetStudentPayments
-- Returns all payment records for a specific student
-- ------------------------------------------------------------
CREATE PROCEDURE `sp_GetStudentPayments`(IN p_studentId INT)
BEGIN
  SELECT p.id, p.amount, p.dueDate, p.paymentDate, p.status,
         p.amountPaid, (p.amount - p.amountPaid) AS balance,
         p.semester, p.description, p.receiptNumber,
         p.createdAt
  FROM Payments p
  WHERE p.studentId = p_studentId
  ORDER BY p.dueDate DESC;
END$$

-- ------------------------------------------------------------
-- SP: GetStudentMaintenanceRequests
-- Returns maintenance requests for a specific student
-- ------------------------------------------------------------
CREATE PROCEDURE `sp_GetStudentMaintenanceRequests`(IN p_studentId INT)
BEGIN
  SELECT m.id, m.title, m.description, m.status, m.adminNotes,
         m.resolvedAt, m.createdAt,
         r.roomNumber
  FROM MaintenanceRequests m
  JOIN Rooms r ON r.id = m.roomId
  WHERE m.studentId = p_studentId
  ORDER BY m.createdAt DESC;
END$$

-- ------------------------------------------------------------
-- SP: GetVisitorLog
-- Returns visitor log filtered by date range
-- ------------------------------------------------------------
CREATE PROCEDURE `sp_GetVisitorLog`(
  IN p_startDate DATE,
  IN p_endDate DATE
)
BEGIN
  SELECT v.id, v.visitorName, v.purpose, v.timeIn, v.timeOut,
         s.firstName AS studentFirstName, s.lastName AS studentLastName,
         s.studentIdNumber
  FROM Visitors v
  JOIN Students s ON s.id = v.studentVisitedId
  WHERE (p_startDate IS NULL OR DATE(v.timeIn) >= p_startDate)
    AND (p_endDate IS NULL OR DATE(v.timeIn) <= p_endDate)
  ORDER BY v.timeIn DESC;
END$$

-- ------------------------------------------------------------
-- SP: AssignStudentToRoom
-- Assigns a student to a room, updates room status, validates capacity
-- ------------------------------------------------------------
CREATE PROCEDURE `sp_AssignStudentToRoom`(
  IN p_studentId INT,
  IN p_roomId INT,
  OUT p_result VARCHAR(255)
)
BEGIN
  DECLARE v_capacity INT;
  DECLARE v_currentOccupancy INT;
  DECLARE v_oldRoomId INT;

  -- Get room capacity
  SELECT capacity INTO v_capacity FROM Rooms WHERE id = p_roomId;
  IF v_capacity IS NULL THEN
    SET p_result = 'Room not found';
  ELSE
    -- Count current occupants
    SELECT COUNT(*) INTO v_currentOccupancy
    FROM Students WHERE roomId = p_roomId AND status = 'active';

    IF v_currentOccupancy >= v_capacity THEN
      SET p_result = 'Room is at full capacity';
    ELSE
      -- Get old room
      SELECT roomId INTO v_oldRoomId FROM Students WHERE id = p_studentId;

      -- Assign student
      UPDATE Students SET roomId = p_roomId WHERE id = p_studentId;

      -- Update new room status to occupied
      UPDATE Rooms SET status = 'occupied' WHERE id = p_roomId;

      -- Update old room status if it becomes empty
      IF v_oldRoomId IS NOT NULL THEN
        IF (SELECT COUNT(*) FROM Students WHERE roomId = v_oldRoomId AND status = 'active') = 0 THEN
          UPDATE Rooms SET status = 'vacant' WHERE id = v_oldRoomId;
        END IF;
      END IF;

      SET p_result = 'OK';
    END IF;
  END IF;
END$$

-- ------------------------------------------------------------
-- SP: RemoveStudentFromRoom
-- Removes a student from their room and updates room status
-- ------------------------------------------------------------
CREATE PROCEDURE `sp_RemoveStudentFromRoom`(
  IN p_studentId INT,
  OUT p_result VARCHAR(255)
)
BEGIN
  DECLARE v_roomId INT;

  SELECT roomId INTO v_roomId FROM Students WHERE id = p_studentId;

  IF v_roomId IS NULL THEN
    SET p_result = 'Student is not assigned to a room';
  ELSE
    UPDATE Students SET roomId = NULL WHERE id = p_studentId;

    -- Check if room is now empty
    IF (SELECT COUNT(*) FROM Students WHERE roomId = v_roomId AND status = 'active') = 0 THEN
      UPDATE Rooms SET status = 'vacant' WHERE id = v_roomId;
    END IF;

    SET p_result = 'OK';
  END IF;
END$$

-- ------------------------------------------------------------
-- SP: ArchiveStudent
-- Archives a student, removes from room, and updates room status
-- ------------------------------------------------------------
CREATE PROCEDURE `sp_ArchiveStudent`(
  IN p_studentId INT,
  OUT p_result VARCHAR(255)
)
BEGIN
  DECLARE v_roomId INT;

  SELECT roomId INTO v_roomId FROM Students WHERE id = p_studentId;

  -- Archive the student
  UPDATE Students SET status = 'archived', roomId = NULL WHERE id = p_studentId;

  -- Update room if needed
  IF v_roomId IS NOT NULL THEN
    IF (SELECT COUNT(*) FROM Students WHERE roomId = v_roomId AND status = 'active') = 0 THEN
      UPDATE Rooms SET status = 'vacant' WHERE id = v_roomId;
    END IF;
  END IF;

  SET p_result = 'OK';
END$$

-- ------------------------------------------------------------
-- SP: RecordPayment
-- Records a payment, auto-calculates status, generates receipt
-- ------------------------------------------------------------
CREATE PROCEDURE `sp_RecordPayment`(
  IN p_paymentId INT,
  IN p_amountPaid DECIMAL(10,2),
  OUT p_result VARCHAR(255)
)
BEGIN
  DECLARE v_amount DECIMAL(10,2);
  DECLARE v_currentPaid DECIMAL(10,2);
  DECLARE v_newPaid DECIMAL(10,2);
  DECLARE v_newStatus VARCHAR(10);
  DECLARE v_receipt VARCHAR(255);

  SELECT amount, amountPaid INTO v_amount, v_currentPaid
  FROM Payments WHERE id = p_paymentId;

  IF v_amount IS NULL THEN
    SET p_result = 'Payment not found';
  ELSE
    SET v_newPaid = v_currentPaid + p_amountPaid;

    IF v_newPaid >= v_amount THEN
      SET v_newStatus = 'paid';
      SET v_newPaid = v_amount;
    ELSE
      SET v_newStatus = 'partial';
    END IF;

    -- Generate receipt number
    SET v_receipt = CONCAT('RCP-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(p_paymentId, 5, '0'));

    UPDATE Payments
    SET amountPaid = v_newPaid,
        status = v_newStatus,
        paymentDate = CURDATE(),
        receiptNumber = COALESCE(receiptNumber, v_receipt)
    WHERE id = p_paymentId;

    SET p_result = 'OK';
  END IF;
END$$

-- ------------------------------------------------------------
-- SP: UpdateMaintenanceStatus
-- Updates maintenance request status, sets resolvedAt if resolved
-- ------------------------------------------------------------
CREATE PROCEDURE `sp_UpdateMaintenanceStatus`(
  IN p_requestId INT,
  IN p_status VARCHAR(20),
  IN p_adminNotes TEXT,
  OUT p_result VARCHAR(255)
)
BEGIN
  IF (SELECT COUNT(*) FROM MaintenanceRequests WHERE id = p_requestId) = 0 THEN
    SET p_result = 'Request not found';
  ELSE
    UPDATE MaintenanceRequests
    SET status = p_status,
        adminNotes = COALESCE(p_adminNotes, adminNotes),
        resolvedAt = IF(p_status = 'resolved', NOW(), resolvedAt)
    WHERE id = p_requestId;

    SET p_result = 'OK';
  END IF;
END$$

-- ------------------------------------------------------------
-- SP: CheckoutVisitor
-- Records visitor checkout time
-- ------------------------------------------------------------
CREATE PROCEDURE `sp_CheckoutVisitor`(
  IN p_visitorId INT,
  OUT p_result VARCHAR(255)
)
BEGIN
  DECLARE v_timeOut DATETIME;

  SELECT timeOut INTO v_timeOut FROM Visitors WHERE id = p_visitorId;

  IF v_timeOut IS NOT NULL THEN
    SET p_result = 'Visitor already checked out';
  ELSE
    UPDATE Visitors SET timeOut = NOW() WHERE id = p_visitorId;
    SET p_result = 'OK';
  END IF;
END$$

-- ------------------------------------------------------------
-- SP: GetMonthlyRevenueReport
-- Returns monthly revenue for the current year
-- ------------------------------------------------------------
CREATE PROCEDURE `sp_GetMonthlyRevenueReport`(IN p_year INT)
BEGIN
  SELECT
    MONTH(paymentDate) AS monthNum,
    MONTHNAME(paymentDate) AS monthName,
    COUNT(*) AS paymentCount,
    COALESCE(SUM(amountPaid), 0) AS totalCollected
  FROM Payments
  WHERE YEAR(paymentDate) = p_year AND paymentDate IS NOT NULL
  GROUP BY MONTH(paymentDate), MONTHNAME(paymentDate)
  ORDER BY monthNum;
END$$

-- ------------------------------------------------------------
-- SP: SearchStudents
-- Searches students by name, ID number, email, or course
-- ------------------------------------------------------------
CREATE PROCEDURE `sp_SearchStudents`(
  IN p_search VARCHAR(255),
  IN p_status VARCHAR(20),
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT s.*, r.roomNumber, r.floor AS roomFloor
  FROM Students s
  LEFT JOIN Rooms r ON r.id = s.roomId
  WHERE (p_status = '' OR p_status IS NULL OR s.status = p_status)
    AND (p_search = '' OR p_search IS NULL
         OR s.firstName LIKE CONCAT('%', p_search, '%')
         OR s.lastName LIKE CONCAT('%', p_search, '%')
         OR s.studentIdNumber LIKE CONCAT('%', p_search, '%')
         OR s.email LIKE CONCAT('%', p_search, '%'))
  ORDER BY s.createdAt DESC
  LIMIT p_limit OFFSET p_offset;
END$$

DELIMITER ;

-- ============================================================
-- SEED: Default Admin Account
-- Password: Admin@123 (bcrypt hash)
-- ============================================================
INSERT INTO `Users` (`name`, `email`, `password`, `role`, `createdAt`, `updatedAt`)
VALUES (
  'Admin',
  'admin@bisu.edu.ph',
  '$2a$10$8Kx5TFYl3UYz7Z5qYqq.hOmHl1n8Y5Z5qYqq.hOmHl1n8Y5Z5qYqq.',
  'admin',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
