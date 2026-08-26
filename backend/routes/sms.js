// backend/routes/sms.js — SMS ব্যবস্থাপনা (bulksmsbd.net)

const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const fetch = require('node-fetch');

// ── bulksmsbd.net API helper ──
// GET: http://bulksmsbd.net/api/smsapi?api_key=KEY&type=text&number=01XXXXXXXXX&senderid=SENDERID&message=TEXT
async function sendBulkSMS(apiKey, senderId, number, message) {
    const url = new URL('http://bulksmsbd.net/api/smsapi');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('type', 'text');
    url.searchParams.set('number', number);
    url.searchParams.set('senderid', senderId);
    url.searchParams.set('message', message);

    const resp = await fetch(url.toString(), { method: 'GET' });
    const text = await resp.text();
    // bulksmsbd returns JSON or plain text
    try { return JSON.parse(text); } catch { return { raw: text }; }
}

// GET: http://bulksmsbd.net/api/getBalanceApi?api_key=KEY
async function fetchLiveBalance(apiKey) {
    const url = `http://bulksmsbd.net/api/getBalanceApi?api_key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(url, { method: 'GET' });
    const text = await resp.text();
    try { return JSON.parse(text); } catch { return { raw: text }; }
}

// ── OTP পাঠানো (format: "Your Barakah Finance OTP is XXXX") ──
router.post('/send-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) return res.status(400).json({ error: 'phone ও otp দিন।' });

        const settings = db.get('settings').value();
        const message = `Your Barakah Finance OTP is ${otp}`;
        let apiStatus = 'not_configured';

        if (settings.smsApiKey && settings.smsSenderId) {
            const result = await sendBulkSMS(settings.smsApiKey, settings.smsSenderId, phone, message);
            apiStatus = result.response_code === 202 ? 'sent' : 'api_error';
        }

        // লগ সংরক্ষণ
        db.get('sms_records').push({
            id: uuidv4(), phone, message, recipientType: 'otp',
            status: apiStatus, sentAt: new Date().toISOString(),
            sentBy: 'system', count: 1
        }).write();

        res.json({ success: true, status: apiStatus, message });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── SMS রেকর্ড তালিকা ──
router.get('/records', verifyToken, requireAdmin, (req, res) => {
    const { from, to, type } = req.query;
    let records = db.get('sms_records').value();
    if (from) records = records.filter(r => r.sentAt >= from);
    if (to)   records = records.filter(r => r.sentAt <= to + 'T23:59:59');
    if (type) records = records.filter(r => r.recipientType === type);
    records = records.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

    const today = new Date().toISOString().split('T')[0];
    const todayCount = records.filter(r => r.sentAt && r.sentAt.startsWith(today)).length;
    res.json({ records, todayCount, total: records.length });
});

// ── SMS পাঠানো (admin) ──
router.post('/send', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { phones, message, templateId, recipientType } = req.body;
        if (!phones || !phones.length || !message)
            return res.status(400).json({ error: 'নম্বর ও বার্তা দিন।' });

        const settings = db.get('settings').value();

        // লোকাল ব্যালেন্স চেক (রিচার্জ − ব্যবহৃত)
        const recharged = db.get('sms_recharge').value().reduce((s, r) => s + (r.amount || 0), 0);
        const used = db.get('sms_records').value().reduce((s, r) => s + (r.count || 1), 0);
        const localBalance = recharged - used;

        if (localBalance < phones.length) {
            return res.status(400).json({
                error: `অপর্যাপ্ত SMS ব্যালেন্স। প্রয়োজন: ${phones.length}, আছে: ${localBalance}`
            });
        }

        const results = [];
        const now = new Date().toISOString();

        for (const phone of phones) {
            const record = {
                id: uuidv4(), phone, message,
                templateId: templateId || null,
                recipientType: recipientType || 'manual',
                status: 'queued', sentAt: now,
                sentBy: req.user.id, count: 1
            };

            if (settings.smsApiKey && settings.smsSenderId) {
                try {
                    const data = await sendBulkSMS(settings.smsApiKey, settings.smsSenderId, phone, message);
                    record.apiResponse = JSON.stringify(data);
                    // bulksmsbd success: response_code === 202
                    record.status = (data.response_code === 202 || data.response_code === '202') ? 'sent' : 'failed';
                } catch (apiErr) {
                    record.status = 'failed';
                    record.error = apiErr.message;
                }
            } else {
                record.status = 'api_not_configured';
            }

            db.get('sms_records').push(record).write();
            results.push(record);
        }

        res.json({
            results,
            sent: results.filter(r => r.status === 'sent').length,
            failed: results.filter(r => r.status === 'failed').length,
            total: phones.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── SMS টেমপ্লেট (GET) ──
router.get('/templates', verifyToken, requireAdmin, (req, res) => {
    res.json({ templates: db.get('sms_templates').value() });
});

// ── SMS টেমপ্লেট (POST) ──
router.post('/templates', verifyToken, requireAdmin, (req, res) => {
    const { category, name, template } = req.body;
    if (!name || !template) return res.status(400).json({ error: 'নাম ও টেমপ্লেট দিন।' });
    const t = {
        id: uuidv4(), category: category || 'custom',
        name, template, active: true,
        createdAt: new Date().toISOString()
    };
    db.get('sms_templates').push(t).write();
    res.status(201).json({ template: t });
});

// ── SMS টেমপ্লেট (PUT) ──
router.put('/templates/:id', verifyToken, requireAdmin, (req, res) => {
    db.get('sms_templates').find({ id: req.params.id }).assign(req.body).write();
    res.json({ message: 'আপডেট হয়েছে।' });
});

// ── SMS টেমপ্লেট (DELETE) ──
router.delete('/templates/:id', verifyToken, requireAdmin, (req, res) => {
    db.get('sms_templates').remove({ id: req.params.id }).write();
    res.json({ message: 'মুছে ফেলা হয়েছে।' });
});

// ── লোকাল SMS ব্যালেন্স ──
router.get('/balance', verifyToken, requireAdmin, (req, res) => {
    const recharged = db.get('sms_recharge').value().reduce((s, r) => s + (r.amount || 0), 0);
    const used = db.get('sms_records').value().reduce((s, r) => s + (r.count || 1), 0);
    res.json({ balance: recharged - used, recharged, used });
});

// ── লাইভ SMS ব্যালেন্স (bulksmsbd.net থেকে) ──
router.get('/balance/live', verifyToken, requireAdmin, async (req, res) => {
    try {
        const settings = db.get('settings').value();
        if (!settings.smsApiKey) {
            return res.status(400).json({ error: 'SMS API Key সেট করা নেই।' });
        }
        const data = await fetchLiveBalance(settings.smsApiKey);
        res.json({ provider: 'bulksmsbd.net', response: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── SMS রিচার্জ (লগ) ──
router.get('/recharge', verifyToken, requireAdmin, (req, res) => {
    const history = db.get('sms_recharge').value()
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ history });
});

router.post('/recharge', verifyToken, requireAdmin, (req, res) => {
    const { amount, note } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'পরিমাণ দিন।' });
    const r = {
        id: uuidv4(), amount: parseInt(amount),
        note: note || '', addedBy: req.user.id,
        date: new Date().toISOString()
    };
    db.get('sms_recharge').push(r).write();

    const recharged = db.get('sms_recharge').value().reduce((s, x) => s + (x.amount || 0), 0);
    const used = db.get('sms_records').value().reduce((s, x) => s + (x.count || 1), 0);
    res.json({ recharge: r, balance: recharged - used, message: 'রিচার্জ সফল।' });
});

// ── SMS API সেটিংস আপডেট ──
router.put('/settings', verifyToken, requireAdmin, (req, res) => {
    const { smsApiKey, smsApiUrl, smsSenderId } = req.body;
    const update = {};
    if (smsApiKey  !== undefined) update.smsApiKey  = smsApiKey;
    if (smsApiUrl  !== undefined) update.smsApiUrl  = smsApiUrl;
    if (smsSenderId !== undefined) update.smsSenderId = smsSenderId;
    db.get('settings').assign(update).write();
    res.json({ message: 'SMS সেটিংস সংরক্ষিত হয়েছে।' });
});

// ── SMS গ্রুপ পাঠানো (সদস্য/ক্লাইন্ট/কমিটি) ──
router.post('/send-group', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { group, message } = req.body;
        // group: 'members' | 'clients' | 'committee' | 'all'
        if (!group || !message) return res.status(400).json({ error: 'গ্রুপ ও বার্তা দিন।' });

        let phones = [];
        if (group === 'members' || group === 'all') {
            const members = db.get('members').value();
            members.forEach(m => { if (m.phone) phones.push(m.phone); });
        }
        if (group === 'clients' || group === 'all') {
            const clients = db.get('clients').value();
            clients.forEach(c => { if (c.phone) phones.push(c.phone); });
        }
        if (group === 'committee' || group === 'all') {
            const committee = db.get('committee').value();
            committee.forEach(c => { if (c.phone) phones.push(c.phone); });
        }

        // ডুপ্লিকেট সরানো
        phones = [...new Set(phones)];
        if (!phones.length) return res.status(400).json({ error: 'কোনো নম্বর পাওয়া যায়নি।' });

        // balance check
        const settings = db.get('settings').value();
        const recharged = db.get('sms_recharge').value().reduce((s, r) => s + (r.amount || 0), 0);
        const used = db.get('sms_records').value().reduce((s, r) => s + (r.count || 1), 0);
        const localBalance = recharged - used;

        if (localBalance < phones.length) {
            return res.status(400).json({
                error: `অপর্যাপ্ত ব্যালেন্স। প্রয়োজন: ${phones.length}, আছে: ${localBalance}`,
                required: phones.length, available: localBalance
            });
        }

        const results = [];
        const now = new Date().toISOString();

        for (const phone of phones) {
            const record = {
                id: uuidv4(), phone, message,
                recipientType: group, status: 'queued',
                sentAt: now, sentBy: req.user.id, count: 1
            };
            if (settings.smsApiKey && settings.smsSenderId) {
                try {
                    const data = await sendBulkSMS(settings.smsApiKey, settings.smsSenderId, phone, message);
                    record.status = (data.response_code === 202 || data.response_code === '202') ? 'sent' : 'failed';
                    record.apiResponse = JSON.stringify(data);
                } catch (e) {
                    record.status = 'failed'; record.error = e.message;
                }
            } else {
                record.status = 'api_not_configured';
            }
            db.get('sms_records').push(record).write();
            results.push(record);
        }

        res.json({
            total: phones.length,
            sent: results.filter(r => r.status === 'sent').length,
            failed: results.filter(r => r.status === 'failed').length,
            results
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
