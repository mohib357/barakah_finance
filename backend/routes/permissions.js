// backend/routes/permissions.js — Role ও Permission ব্যবস্থাপনা
// Website.txt: "Role-based access control যথাযথভাবে implement করতে হবে"

const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Permission modules — সব module ও তাদের actions
const PERMISSION_MODULES = {
    dashboard:     ['view'],
    members:       ['view', 'create', 'edit', 'cancel', 'approve', 'export'],
    customers:     ['view', 'create', 'edit', 'cancel', 'approve', 'export'],
    products:      ['view', 'create', 'edit', 'delete', 'manage'],
    orders:        ['view', 'create', 'edit', 'cancel', 'approve', 'export'],
    installments:  ['view', 'create', 'edit', 'cancel', 'approve', 'export'],
    payments:      ['view', 'create', 'reverse', 'export', 'print'],
    receipts:      ['view', 'print', 'cancel'],
    savings:       ['view', 'create', 'edit', 'export'],
    investment:    ['view', 'create', 'edit', 'approve', 'export'],
    projects:      ['view', 'create', 'edit', 'cancel', 'approve', 'export'],
    qard:          ['view', 'create', 'edit', 'approve', 'reject', 'export'],
    charity:       ['view', 'create', 'edit', 'approve', 'export'],
    accounts:      ['view', 'create', 'reverse', 'export'],
    expenses:      ['view', 'create', 'edit', 'cancel', 'export'],
    assets:        ['view', 'create', 'edit', 'export'],
    reports:       ['view', 'export', 'print'],
    kyc:           ['view', 'approve', 'reject'],
    documents:     ['view', 'create', 'delete'],
    sms:           ['view', 'create', 'manage'],
    notifications: ['view', 'create', 'manage'],
    committee:     ['view', 'create', 'edit', 'manage'],
    website:       ['view', 'create', 'edit', 'manage'],
    users:         ['view', 'create', 'edit', 'manage'],
    roles:         ['view', 'create', 'edit', 'manage'],
    permissions:   ['view', 'manage'],
    audit_log:     ['view'],
    backup:        ['view', 'create', 'restore'],
    settings:      ['view', 'manage']
};

// Default permission sets per role
const DEFAULT_PERMISSIONS = {
    admin: Object.fromEntries(
        Object.entries(PERMISSION_MODULES).map(([mod, actions]) => [mod, Object.fromEntries(actions.map(a => [a, true]))])
    ),
    manager: {
        dashboard: { view: true },
        members: { view: true, create: true, edit: true, export: true },
        customers: { view: true, create: true, edit: true, export: true },
        products: { view: true, manage: true },
        orders: { view: true, edit: true, approve: true, export: true },
        installments: { view: true, create: true, edit: true, export: true },
        payments: { view: true, create: true, export: true, print: true },
        receipts: { view: true, print: true },
        savings: { view: true, create: true, edit: true, export: true },
        qard: { view: true, create: true, edit: true, export: true },
        charity: { view: true, create: true, export: true },
        accounts: { view: true, create: true, export: true },
        expenses: { view: true, create: true, export: true },
        reports: { view: true, export: true, print: true },
        sms: { view: true, create: true },
        committee: { view: true },
        website: { view: true, create: true, edit: true },
        users: { view: true }
    },
    staff: {
        dashboard: { view: true },
        members: { view: true },
        customers: { view: true },
        payments: { view: true, create: true, print: true },
        receipts: { view: true, print: true },
        savings: { view: true, create: true },
        reports: { view: true }
    },
    member: {
        dashboard: { view: true }
    },
    user: {
        dashboard: { view: true }
    }
};

// ── সব permission list (module structure) ──
router.get('/modules', verifyToken, requireAdmin, (req, res) => {
    res.json({ modules: PERMISSION_MODULES });
});

// ── একজন user-এর permission পাওয়া ──
router.get('/user/:userId', verifyToken, requireAdmin, (req, res) => {
    const user = db.get('users').find({ id: req.params.userId }).value();
    if (!user) return res.status(404).json({ error: 'ব্যবহারকারী পাওয়া যায়নি।' });

    // Custom permissions আছে কি?
    const custom = db.get('permissions').value()[req.params.userId];
    // Default by role
    const roleDefault = DEFAULT_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS.user;

    const effective = custom || roleDefault;
    res.json({ userId: req.params.userId, role: user.role, permissions: effective, isCustom: !!custom });
});

// ── একজন user-এর permission আপডেট ──
router.put('/user/:userId', verifyToken, requireAdmin, (req, res) => {
    const { permissions } = req.body;
    if (!permissions || typeof permissions !== 'object') {
        return res.status(400).json({ error: 'permission object প্রয়োজন।' });
    }

    const user = db.get('users').find({ id: req.params.userId }).value();
    if (!user) return res.status(404).json({ error: 'ব্যবহারকারী পাওয়া যায়নি।' });

    // Super admin (ADMIN-001)-এর permissions পরিবর্তন করা যাবে না
    if (req.params.userId === 'ADMIN-001') {
        return res.status(403).json({ error: 'Super Admin-এর permissions পরিবর্তন করা যায় না।' });
    }

    const old = JSON.stringify(db.get('permissions').value()[req.params.userId] || {});
    const allPerms = db.get('permissions').value();
    allPerms[req.params.userId] = permissions;
    db.set('permissions', allPerms).write();

    db.get('audit_log').push({
        id: uuidv4(), action: 'UPDATE_PERMISSIONS', module: 'permissions',
        recordId: req.params.userId, oldValue: old, newValue: JSON.stringify(permissions),
        userId: req.user.id, date: new Date().toISOString()
    }).write();

    res.json({ message: 'Permission আপডেট হয়েছে।', permissions });
});

// ── একজন user-এর custom permission রিসেট (role default-এ ফিরে যাওয়া) ──
router.delete('/user/:userId', verifyToken, requireAdmin, (req, res) => {
    if (req.params.userId === 'ADMIN-001') {
        return res.status(403).json({ error: 'Super Admin-এর permissions পরিবর্তন করা যায় না।' });
    }
    const allPerms = db.get('permissions').value();
    delete allPerms[req.params.userId];
    db.set('permissions', allPerms).write();
    res.json({ message: 'Custom permission সরিয়ে role default-এ ফিরিয়ে দেওয়া হয়েছে।' });
});

// ── একটি নির্দিষ্ট permission check করা ──
router.post('/check', verifyToken, (req, res) => {
    const { module: mod, action } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    // Super admin সব পারে
    if (userId === 'ADMIN-001' || role === 'admin') {
        return res.json({ allowed: true });
    }

    // Custom permissions
    const custom = db.get('permissions').value()[userId];
    const roleDefault = DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.user;
    const effective = custom || roleDefault;

    const allowed = !!(effective[mod] && effective[mod][action]);
    res.json({ allowed, module: mod, action, role });
});

// Middleware: permission check করার জন্য
function requirePermission(mod, action) {
    return (req, res, next) => {
        const userId = req.user?.id;
        const role = req.user?.role;
        if (!userId) return res.status(401).json({ error: 'অ্যাক্সেস টোকেন প্রয়োজন।' });
        if (userId === 'ADMIN-001' || role === 'admin') return next();

        const custom = db.get('permissions').value()[userId];
        const roleDefault = DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.user;
        const effective = custom || roleDefault;
        const allowed = !!(effective[mod] && effective[mod][action]);

        if (!allowed) return res.status(403).json({ error: `${mod}:${action} — অ্যাক্সেস অনুমতি নেই।` });
        next();
    };
}

module.exports = { router, requirePermission, PERMISSION_MODULES, DEFAULT_PERMISSIONS };
