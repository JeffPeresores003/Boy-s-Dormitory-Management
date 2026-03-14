require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/config');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/tenants', require('./routes/tenants.routes'));
app.use('/api/rooms', require('./routes/rooms.routes'));
app.use('/api/payments', require('./routes/payments.routes'));
app.use('/api/visitors', require('./routes/visitors.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BISU Dormitory API is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
