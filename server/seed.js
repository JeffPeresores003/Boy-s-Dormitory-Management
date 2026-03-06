require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/config');

const seed = async () => {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@bisu.edu.ph';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';

    const [existing] = await pool.execute("SELECT id FROM Users WHERE email = ?", [email]);
    if (existing.length > 0) {
      console.log('Admin account already exists:', email);
    } else {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      await pool.execute(
        "INSERT INTO Users (name, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, 'admin', NOW(), NOW())",
        ['System Administrator', email, hashedPassword]
      );
      console.log('Admin account created successfully');
      console.log(`  Email: ${email}`);
      console.log(`  Password: ${password}`);
    }

    console.log('Seed completed');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seed();
