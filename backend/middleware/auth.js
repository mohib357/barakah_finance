// C:\Project\Barakah_Finance\backend\middleware\auth.js

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'barakah_finance_secret_2026';

// ── টোকেন যাচাই ──
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'অ্যাক্সেস টোকেন প্রয়োজন' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'অবৈধ বা মেয়াদোত্তীর্ণ টোকেন' });
    }
}

// ── অ্যাডমিন যাচাই ──
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'শুধুমাত্র অ্যাডমিনের অ্যাক্সেস আছে' });
    }
    next();
}

// ── সদস্য বা অ্যাডমিন ──
function requireMemberOrAdmin(req, res, next) {
    if (!req.user || !['admin', 'member'].includes(req.user.role)) {
        return res.status(403).json({ error: 'শুধুমাত্র সদস্য বা অ্যাডমিনের অ্যাক্সেস আছে' });
    }
    next();
}

// ── টোকেন তৈরি ──
function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

module.exports = { verifyToken, requireAdmin, requireMemberOrAdmin, generateToken };