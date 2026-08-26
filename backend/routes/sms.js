// backend/routes/sms.js — SMS ব্যবস্থাপনা

const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ── SMS রেকর্ড ──
router.get('/records', verifyToken, requireAdmin, (req, res) => {
    const { from, to, type } = req.query;
    let records = db.get('sms_records').value();
    if (from) records = records.filter(r => r.sentAt >= from);
    if (to) records = records.filter(r => r.sentAt <= to);
    if (type) records = records.filter(r => r.recipientType === type);
    records = records.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

    // Stats
    const today = new Date().toISOString().split('T')[0];
    const todayCount = records.filter(r => r.sentAt && r.sentAt.startsWith(today)).length;
    res.json({ records, todayCount, total: records.length });
});

// ── SMS পাঠান ──
router.post('/send', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { phones, message, templateId, recipientType } = req.body;
        if (!phones || !phones.length || !message) return res.status(400).json({ error: 'নম্বর ও বার্তা দিন।' });

        const settings = db.get('settings').value();
        const balance = db.get('sms_recharge').value().reduce((s, r) => s + (r.amount || 0), 0)
            - db.get('sms_records').value().reduce((s, r) => s + (r.count || 1), 0);

        if (balance < phones.length) {
            return res.status(400).json({ error: `অপর্যাপ্ত SMS ব্যালেন্স। প্রয়োজন: ${phones.length}, আছে: ${balance}` });
        }

        const results = [];
        const now = new Date().toISOString();

        for (const phone of phones) {
            const record = {
                id: uuidv4(), phone, message, templateId: templateId || null,
                recipientType: recipientType || 'manual', status: 'sent',
                sentAt: now, sentBy: req.user.id, count: 1
            };

            // Real SMS sending (if API configured)
            if (settings.smsApiKey && settings.smsApiUrl) {
                try {
                    const fetch = require('node-fetch');
                    const resp = await fetch(settings.smsApiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ api_key: settings.smsApiKey, sender_id: settings.smsSenderId, to: phone, message })
                    });
                    const data = await resp.json();
                    record.apiResponse = JSON.stringify(data);
                    record.status = data.status === 'success' ? 'sent' : 'failed';
                } catch (apiErr) {
                    record.status = 'failed'; record.error = apiErr.message;
                }
            }

            db.get('sms_records').push(record).write();
            results.push(record);
        }

        res.json({ results, sent: results.filter(r => r.status === 'sent').length, total: phones.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── SMS টেমপ্লেট ──
router.get('/templates', verifyToken, requireAdmin, (req, res) => {
    res.json({ templates: db.get('sms_templates').value() });
});

router.post('/templates', verifyToken, requireAdmin, (req, res) => {
    const { category, name, template } = req.body;
    if (!name || !template) return res.status(400).json({ error: 'নাম ও টেমপ্লেট দিন।' });
    const t = { id: uuidv4(), category: category || 'custom', name, template, active: true, createdAt: new Date().toISOString() };
    db.get('sms_templates').push(t).write();
    res.status(201).json({ template: t });
});

router.put('/templates/:id', verifyToken, requireAdmin, (req, res) => {
    db.get('sms_templates').find({ id: req.params.id }).assign(req.body).write();
    res.json({ message: 'আপডেট হয়েছে।' });
});

// ── SMS ব্যালেন্স ──
router.get('/balance', verifyToken, requireAdmin, (req, res) => {
    const recharged = db.get('sms_recharge').value().reduce((s, r) => s + (r.amount || 0), 0);
    const used = db.get('sms_records').value().reduce((s, r) => s + (r.count || 1), 0);
    res.json({ balance: recharged - used, recharged, used });
});

// ── SMS রিচার্জ ──
router.post('/recharge', verifyToken, requireAdmin, (req, res) => {
    const { amount, note } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'পরিমাণ দিন।' });
    const r = { id: uuidv4(), amount: parseInt(amount), note: note || '', addedBy: req.user.id, date: new Date().toISOString() };
    db.get('sms_recharge').push(r).write();
    const recharged = db.get('sms_recharge').value().reduce((s, x) => s + (x.amount || 0), 0);
    const used = db.get('sms_records').value().reduce((s, x) => s + (x.count || 1), 0);
    res.json({ recharge: r, balance: recharged - used, message: 'রিচার্জ সফল।' });
});

module.exports = router;
