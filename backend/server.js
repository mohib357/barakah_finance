// C:\Project\Barakah_Finance\backend\server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500', '*'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static files (frontend) ──
// আপনার প্রজেক্ট ফোল্ডার এখানে সেট করুন
app.use(express.static(path.join(__dirname, '../')));

// ── Routes ──
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const savingsRoutes = require('./routes/savings');
const loansRoutes = require('./routes/loans');
const ordersRoutes = require('./routes/orders');
const productsRoutes = require('./routes/products');
const noticesRoutes = require('./routes/notices');
const badgesRoutes = require('./routes/badges');
const applicationsRoutes = require('./routes/applications');
const ledgerRoutes = require('./routes/ledger');
const reportsRoutes = require('./routes/reports');
// New routes
const membersRoutes = require('./routes/members');
const clientsRoutes = require('./routes/clients');
const accountsRoutes = require('./routes/accounts');
const projectsRoutes = require('./routes/projects');
const committeeRoutes = require('./routes/committee');
const smsRoutes = require('./routes/sms');
const auditRoutes = require('./routes/audit');
const charityRoutes = require('./routes/charity');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/notices', noticesRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/reports', reportsRoutes);
// New routes
app.use('/api/members', membersRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/committee', committeeRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/charity', charityRoutes);

// ── Health check ──
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'বারাকাহ ফাইন্যান্স API চলছে', time: new Date().toISOString() });
});

// ── Root ──
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// ── Error handler ──
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'সার্ভার সমস্যা', detail: err.message });
});

app.listen(PORT, () => {
    console.log(`✅ বারাকাহ ফাইন্যান্স সার্ভার চালু: http://localhost:${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api/health`);
});

module.exports = app;