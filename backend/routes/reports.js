// C:\Project\Barakah_Finance\backend\routes\reports.js

const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ── সম্পূর্ণ ড্যাশবোর্ড পরিসংখ্যান ──
router.get('/dashboard', verifyToken, requireAdmin, (req, res) => {
    const users = db.get('users').value();
    const savings = db.get('savings').value();
    const loans = db.get('loans').value();
    const orders = db.get('orders').value();
    const applications = db.get('applications').value();
    const members = db.get('members').filter({ status: 'active' }).value();
    const clients = db.get('clients').value();
    const ledger = db.get('ledger').value();
    const charityFund = db.get('charity_fundraising').value();
    const charityExp = db.get('charity_expenditure').value();
    const settings = db.get('settings').value();

    const thisMonth = new Date().toISOString().slice(0, 7);
    const now = new Date();

    // Monthly savings for last 6 months
    const savedByMonth = {};
    savings.forEach(s => { if (s.month) savedByMonth[s.month] = (savedByMonth[s.month] || 0) + (s.amount || 0); });

    // Client fund stats
    const installments = db.get('installments').value();
    const totalClientPaid = installments.filter(i => i.status === 'paid').reduce((s, i) => s + (i.paidAmount || 0), 0);
    const totalClientDue = installments.filter(i => ['due', 'overdue', 'upcoming'].includes(i.status)).reduce((s, i) => s + (i.remainingAmount || 0), 0);

    // Charity balance
    const charityIn  = charityFund.reduce((s, c) => s + (c.amount || 0), 0);
    const charityOut = charityExp.reduce((s, c) => s + (c.amount || 0), 0);

    // Pending actions
    const pendingMemberships = applications.filter(a => a.status === 'pending').length;
    const overdueInstallments = installments.filter(i => i.status === 'overdue').length;
    const pendingQard = loans.filter(l => l.status === 'pending').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const pendingWithdrawals = (db.get('withdrawal_requests')?.value() || []).filter(w => w.status === 'pending').length;

    // Today's birthdays
    const todayMD = `${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const birthdayUsers = users.filter(u => u.dob && u.dob.substring(5) === todayMD).map(u => ({ name: u.name, phone: u.phone }));

    res.json({
        users: {
            total: users.filter(u => u.verified).length,
            members: members.length,
            newThisMonth: users.filter(u => u.createdAt?.startsWith(thisMonth)).length
        },
        savings: {
            total: savings.reduce((a, s) => a + s.amount, 0),
            thisMonth: savings.filter(s => s.month === thisMonth).reduce((a, s) => a + s.amount, 0),
            count: savings.length
        },
        savedByMonth,
        loans: {
            active: loans.filter(l => l.status === 'active').length,
            outstanding: loans.filter(l => l.status === 'active').reduce((a, l) => a + (l.remaining || 0), 0),
            total: loans.length
        },
        orders: {
            pending: pendingOrders,
            total: orders.length
        },
        applications: {
            pending: pendingMemberships,
            approved: applications.filter(a => a.status === 'approved').length,
            total: applications.length
        },
        clients: {
            total: clients.length,
            active: clients.filter(c => c.status === 'active').length,
            paid: clients.filter(c => c.status === 'paid').length,
            totalReceived: totalClientPaid,
            totalDue: totalClientDue
        },
        charity: {
            income: charityIn,
            expense: charityOut,
            balance: charityIn - charityOut
        },
        income: ledger.filter(l => l.type === 'income').reduce((s, l) => s + (l.amount || 0), 0),
        expense: ledger.filter(l => l.type === 'expense').reduce((s, l) => s + (l.amount || 0), 0),
        pendingActions: {
            memberships: pendingMemberships,
            overdueInstallments,
            qardApplications: pendingQard,
            orders: pendingOrders,
            withdrawals: pendingWithdrawals
        },
        todayBirthdays: birthdayUsers,
        smsBalance: settings.smsBalance || 0
    });
});

// ── সদস্যদের সঞ্চয় রিপোর্ট ──
router.get('/member-savings', verifyToken, requireAdmin, (req, res) => {
    const members = db.get('users').filter(u => u.role === 'member').value();
    const savings = db.get('savings').value();
    const settings = db.get('settings').value();

    const report = members.map(m => {
        const ms = savings.filter(s => s.userId === m.id);
        const total = ms.reduce((a, s) => a + s.amount, 0);
        const months = ms.map(s => s.month);
        return {
            id: m.id, name: m.name, memberID: m.memberID, phone: m.phone,
            totalSaved: total, monthCount: ms.length,
            expected: settings.monthlySavings, deficit: Math.max(0, settings.monthlySavings - total % settings.monthlySavings),
            lastPayment: ms.slice(-1)[0]?.date || null
        };
    });

    res.json({ report, total: report.reduce((a, r) => a + r.totalSaved, 0) });
});

// ── মাসিক না দেওয়া সদস্যদের তালিকা ──
router.get('/defaulters/:month', verifyToken, requireAdmin, (req, res) => {
    const { month } = req.params;
    const members = db.get('users').filter(u => u.role === 'member').value();
    const paid = db.get('savings').filter({ month }).map(s => s.userId).value();
    const defaulters = members.filter(m => !paid.includes(m.id));
    res.json({ month, defaulters: defaulters.map(m => ({ id: m.id, name: m.name, phone: m.phone, memberID: m.memberID })), count: defaulters.length });
});

// ── লোন রিপোর্ট ──
router.get('/loan-summary', verifyToken, requireAdmin, (req, res) => {
    const loans = db.get('loans').value();
    const users = db.get('users').value();

    const enriched = loans.map(l => ({
        ...l,
        userName: users.find(u => u.id === l.userId)?.name || l.userName
    }));

    res.json({
        all: enriched,
        byStatus: {
            pending: enriched.filter(l => l.status === 'pending').length,
            active: enriched.filter(l => l.status === 'active').length,
            paid: enriched.filter(l => l.status === 'paid').length,
            rejected: enriched.filter(l => l.status === 'rejected').length
        },
        totalGiven: loans.filter(l => ['active', 'paid'].includes(l.status)).reduce((a, l) => a + l.amount, 0),
        totalOutstanding: loans.filter(l => l.status === 'active').reduce((a, l) => a + l.remaining, 0),
        totalRecovered: loans.filter(l => l.status === 'paid').reduce((a, l) => a + l.amount, 0)
    });
});

// ── সাইট সেটিংস ──
router.get('/settings', verifyToken, requireAdmin, (req, res) => {
    res.json(db.get('settings').value());
});

router.put('/settings', verifyToken, requireAdmin, (req, res) => {
    const allowed = [
        'monthlySavings', 'lateFee', 'profitMargin', 'maxLoan', 'registrationOpen',
        'noticeSpeed', 'siteName', 'slogan', 'phone', 'address', 'email', 'website',
        'unitValue', 'savingsDueDay', 'savingsWarnDay', 'installmentGraceDays',
        'memberProfitShare', 'charityShare', 'orgShare', 'formFee', 'maxGuarantors',
        'withdrawalNoticeDays', 'fbPageUrl', 'smsApiKey', 'smsApiUrl', 'smsSenderId',
        'twoFAEnabled', 'backupEnabled', 'backupIntervalHours', 'backupRetentionDays',
        'profitCalcMethod', 'clientFund'
    ];
    const old = JSON.stringify(db.get('settings').value());
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    db.get('settings').assign(updates).write();

    // Audit log for sensitive setting changes
    const sensitiveKeys = ['unitValue', 'memberProfitShare', 'charityShare', 'orgShare', 'profitMargin', 'lateFee', 'maxLoan'];
    const changedSensitive = sensitiveKeys.filter(k => updates[k] !== undefined);
    if (changedSensitive.length > 0) {
        const { uuidv4: uid } = require('../db/database');
        db.get('audit_log').push({
            id: uid(),
            action: 'CHANGE_SETTINGS',
            module: 'settings',
            recordId: 'settings',
            oldValue: old,
            newValue: JSON.stringify(updates),
            reason: req.body.changeReason || 'Settings updated',
            userId: req.user.id,
            date: new Date().toISOString()
        }).write();
    }

    res.json({ message: 'সেটিংস আপডেট হয়েছে', settings: db.get('settings').value() });
});

// ── ব্যাকআপ ──
const path = require('path');
const fs = require('fs');

router.post('/backup', verifyToken, requireAdmin, (req, res) => {
    try {
        const data = db.get('').value ? db.getState() : JSON.parse(fs.readFileSync(path.join(__dirname, '../db/data.json'), 'utf8'));
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const backupDir = path.join(__dirname, '../db/backups');

        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

        const filename = `backup_${timestamp}.json`;
        const filepath = path.join(backupDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');

        // ৬০ দিনের বেশি পুরোনো ব্যাকআপ মুছো
        const retentionDays = db.get('settings').value().backupRetentionDays || 60;
        const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
        fs.readdirSync(backupDir).forEach(f => {
            if (f.startsWith('backup_') && f.endsWith('.json')) {
                const fpath = path.join(backupDir, f);
                if (fs.statSync(fpath).mtimeMs < cutoff) fs.unlinkSync(fpath);
            }
        });

        // Audit log
        const { uuidv4: uid } = require('../db/database');
        db.get('audit_log').push({
            id: uid(), action: 'BACKUP_CREATED', module: 'backup', recordId: filename,
            newValue: JSON.stringify({ filename, size: fs.statSync(filepath).size }),
            userId: req.user.id, date: new Date().toISOString()
        }).write();

        res.json({ message: 'ব্যাকআপ সম্পন্ন হয়েছে', filename, timestamp });
    } catch (err) {
        res.status(500).json({ error: 'ব্যাকআপ ব্যর্থ হয়েছে: ' + err.message });
    }
});

// ── ব্যাকআপ তালিকা ──
router.get('/backups', verifyToken, requireAdmin, (req, res) => {
    try {
        const backupDir = path.join(__dirname, '../db/backups');
        if (!fs.existsSync(backupDir)) return res.json({ backups: [] });
        const backups = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
            .map(f => {
                const fpath = path.join(backupDir, f);
                const stat = fs.statSync(fpath);
                return { filename: f, size: stat.size, createdAt: stat.mtime.toISOString() };
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json({ backups });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── ব্যাকআপ ডাউনলোড ──
router.get('/backups/:filename', verifyToken, requireAdmin, (req, res) => {
    const backupDir = path.join(__dirname, '../db/backups');
    const filepath = path.join(backupDir, req.params.filename);
    // Path traversal protection
    if (!filepath.startsWith(backupDir)) return res.status(400).json({ error: 'অবৈধ পথ' });
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'ফাইল পাওয়া যায়নি' });
    res.download(filepath);
});

module.exports = router;