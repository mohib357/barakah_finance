// C:\Project\Barakah_Finance\backend\server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Validate critical env vars on startup ──
if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        console.error('❌ JWT_SECRET is not set. Server will not start in production without it.');
        process.exit(1);
    } else {
        console.warn('⚠️  JWT_SECRET not set in .env — using insecure dev default. Set it before deploying!');
        process.env.JWT_SECRET = 'barakah_dev_secret_change_before_production';
    }
}

// ── Security headers (basic, without helmet package) ──
app.use(function(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// ── Basic rate limiting (no extra package needed) ──
const _rateMap = new Map();
const RATE_WINDOW_MS = 60 * 1000;   // 1 minute window
const RATE_LIMIT_AUTH = 10;          // max 10 auth requests per minute per IP
app.use('/api/auth', function(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = _rateMap.get(ip) || { count: 0, start: now };
    if (now - entry.start > RATE_WINDOW_MS) { entry.count = 1; entry.start = now; }
    else { entry.count++; }
    _rateMap.set(ip, entry);
    if (entry.count > RATE_LIMIT_AUTH) {
        return res.status(429).json({ error: 'অনেক বেশি অনুরোধ। ১ মিনিট পরে আবার চেষ্টা করুন।' });
    }
    next();
});

// ── CORS ──
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:5500,http://localhost:5500,http://localhost:3001').split(',');
app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('CORS নীতি: অননুমোদিত উৎস'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static files (frontend) ──
app.use(express.static(path.join(__dirname, '../')));

// ── Routes ──
const authRoutes         = require('./routes/auth');
const userRoutes         = require('./routes/users');
const savingsRoutes      = require('./routes/savings');
const loansRoutes        = require('./routes/loans');
const ordersRoutes       = require('./routes/orders');
const productsRoutes     = require('./routes/products');
const noticesRoutes      = require('./routes/notices');
const badgesRoutes       = require('./routes/badges');
const applicationsRoutes = require('./routes/applications');
const ledgerRoutes       = require('./routes/ledger');
const reportsRoutes      = require('./routes/reports');
const membersRoutes      = require('./routes/members');
const clientsRoutes      = require('./routes/clients');
const accountsRoutes     = require('./routes/accounts');
const projectsRoutes     = require('./routes/projects');
const committeeRoutes    = require('./routes/committee');
const smsRoutes          = require('./routes/sms');
const auditRoutes        = require('./routes/audit');
const charityRoutes      = require('./routes/charity');
const fundTransfersRoutes = require('./routes/fund_transfers');
const reviewsRoutes      = require('./routes/reviews');
const postsRoutes        = require('./routes/posts');
const { router: permissionsRouter } = require('./routes/permissions');
const profitRoutes       = require('./routes/profit');

app.use('/api/auth',           authRoutes);
app.use('/api/users',          userRoutes);
app.use('/api/savings',        savingsRoutes);
app.use('/api/loans',          loansRoutes);
app.use('/api/orders',         ordersRoutes);
app.use('/api/products',       productsRoutes);
app.use('/api/notices',        noticesRoutes);
app.use('/api/badges',         badgesRoutes);
app.use('/api/applications',   applicationsRoutes);
app.use('/api/ledger',         ledgerRoutes);
app.use('/api/reports',        reportsRoutes);
app.use('/api/members',        membersRoutes);
app.use('/api/clients',        clientsRoutes);
app.use('/api/accounts',       accountsRoutes);
app.use('/api/projects',       projectsRoutes);
app.use('/api/committee',      committeeRoutes);
app.use('/api/sms',            smsRoutes);
app.use('/api/audit',          auditRoutes);
app.use('/api/charity',        charityRoutes);
app.use('/api/fund-transfers', fundTransfersRoutes);
app.use('/api/reviews',        reviewsRoutes);
app.use('/api/posts',          postsRoutes);
app.use('/api/permissions',    permissionsRouter);
app.use('/api/profit',         profitRoutes);

// ── Health check ──
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'বারাকাহ ফাইন্যান্স API চলছে',
        time: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development'
    });
});

// ── Root → serve frontend ──
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// ── 404 handler (API routes not found) ──
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API endpoint পাওয়া যায়নি', path: req.path });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
    console.error('[Server Error]', err.stack);
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(err.status || 500).json({
        error: 'সার্ভার সমস্যা হয়েছে।',
        ...(isDev && { detail: err.message })
    });
});

app.listen(PORT, () => {
    console.log(`✅ বারাকাহ ফাইন্যান্স সার্ভার চালু: http://localhost:${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

// ── Middleware ──
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:5500,http://localhost:5500').split(',');
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, curl, same-origin)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('CORS নীতি: অননুমোদিত উৎস'));
        }
    },
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
// Additional routes
const fundTransfersRoutes = require('./routes/fund_transfers');
const reviewsRoutes = require('./routes/reviews');
const postsRoutes = require('./routes/posts');
const { router: permissionsRouter } = require('./routes/permissions');
const profitRoutes = require('./routes/profit');

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
// Additional routes
app.use('/api/fund-transfers', fundTransfersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/permissions', permissionsRouter);
app.use('/api/profit', profitRoutes);

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