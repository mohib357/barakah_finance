// C:\Project\Barakah_Finance\backend\routes\auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, uuidv4 } = require('../db/database');
const { generateToken, verifyToken } = require('../middleware/auth');

// ── লগইন ──
router.post('/login', (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
        return res.status(400).json({ error: 'সকল তথ্য পূরণ করুন' });
    }

    const q = identifier.toLowerCase().trim();
    const user = db.get('users').find(u =>
        u.phone === q || u.email?.toLowerCase() === q ||
        u.username?.toLowerCase() === q || u.memberID?.toLowerCase() === q
    ).value();

    if (!user) return res.status(401).json({ error: 'ব্যবহারকারী পাওয়া যায়নি' });
    if (!user.verified) return res.status(401).json({ error: 'অ্যাকাউন্ট যাচাই হয়নি' });

    const match = bcrypt.compareSync(password, user.password);
    if (!match) return res.status(401).json({ error: 'পাসওয়ার্ড ভুল' });

    const token = generateToken(user);
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser, message: 'লগইন সফল' });
});

// ── সাইনআপ (OTP পাঠানো) ──
router.post('/signup', async (req, res) => {
    const { name, surname, dob, username, phone, email, password, referral } = req.body;

    if (!name || !phone || !username || !password) {
        return res.status(400).json({ error: 'সকল তারকা চিহ্নিত তথ্য পূরণ করুন' });
    }
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        return res.status(400).json({ error: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষর, সংখ্যা ও লেটার থাকতে হবে' });
    }

    // ডুপ্লিকেট চেক
    if (db.get('users').find({ phone }).value()) {
        return res.status(400).json({ error: 'এই নম্বরে ইতিমধ্যে অ্যাকাউন্ট আছে' });
    }
    if (db.get('users').find({ username }).value()) {
        return res.status(400).json({ error: 'এই ইউজারনেম নেওয়া হয়েছে' });
    }

    // OTP তৈরি (৬ সংখ্যা)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const exp = Date.now() + 10 * 60 * 1000; // ১০ মিনিট

    // OTP সংরক্ষণ
    db.get('otp_store').remove({ phone }).write();
    db.get('otp_store').push({ phone, otp, exp, userData: { name, surname, dob, username, phone, email, password, referral } }).write();

    // SMS পাঠানো (API থাকলে)
    const settings = db.get('settings').value();
    const smsMsg = `বারাকাহ ফাইন্যান্স: আপনার OTP হলো ${otp}। এটি ১০ মিনিটের জন্য বৈধ। কাউকে শেয়ার করবেন না।`;
    let smsSent = false;
    if (settings.smsApiKey && settings.smsApiUrl) {
        try {
            const fetch = require('node-fetch');
            const smsRes = await fetch(`${settings.smsApiUrl}?api_key=${settings.smsApiKey}&type=text&number=${phone}&senderid=${settings.smsSenderId || ''}&message=${encodeURIComponent(smsMsg)}`);
            const smsData = await smsRes.json();
            smsSent = smsData.response_code === 202 || smsData.error_code === '0';
            db.get('sms_records').push({ id: require('../db/database').uuidv4(), phone, message: smsMsg, status: smsSent ? 'sent' : 'failed', sentAt: new Date().toISOString(), sentBy: 'system', count: 1 }).write();
        } catch (_) { /* SMS fail হলেও signup চলবে */ }
    }
    console.log(`[OTP] ${phone} → ${otp}`);

    // Development mode-এ demo_otp দেখানো, production-এ না
    const resp = { message: 'OTP পাঠানো হয়েছে', phone, smsSent };
    if (process.env.NODE_ENV !== 'production') resp.demo_otp = otp;
    res.json(resp);
});

// ── OTP যাচাই ──
router.post('/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'তথ্য অসম্পূর্ণ' });

    const record = db.get('otp_store').find({ phone }).value();
    if (!record) return res.status(400).json({ error: 'OTP পাওয়া যায়নি' });
    if (Date.now() > record.exp) {
        db.get('otp_store').remove({ phone }).write();
        return res.status(400).json({ error: 'OTP মেয়াদ শেষ' });
    }
    if (record.otp !== otp.toString()) return res.status(400).json({ error: 'OTP ভুল' });

    // ব্যবহারকারী তৈরি
    const { userData } = record;
    const hash = bcrypt.hashSync(userData.password, 10);
    const newUser = {
        id: uuidv4(),
        name: userData.name + (userData.surname ? ' ' + userData.surname : ''),
        username: userData.username,
        phone: userData.phone,
        email: userData.email || null,
        dob: userData.dob || null,
        password: hash,
        role: 'user',
        verified: true,
        referral: userData.referral || null,
        memberID: null,
        profileComplete: 40,
        createdAt: new Date().toISOString()
    };

    db.get('users').push(newUser).write();
    db.get('otp_store').remove({ phone }).write();

    const token = generateToken(newUser);
    const { password: _, ...safeUser } = newUser;
    res.json({ token, user: safeUser, message: 'নিবন্ধন সফল' });
});

// ── OTP পুনরায় পাঠান ──
router.post('/resend-otp', async (req, res) => {
    const { phone } = req.body;
    const record = db.get('otp_store').find({ phone }).value();
    if (!record) return res.status(400).json({ error: 'আগে সাইনআপ করুন' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const exp = Date.now() + 10 * 60 * 1000;
    db.get('otp_store').find({ phone }).assign({ otp, exp }).write();
    console.log(`[OTP RESEND] ${phone} → ${otp}`);

    // SMS
    const settings = db.get('settings').value();
    const smsMsg = `বারাকাহ ফাইন্যান্স: আপনার OTP হলো ${otp}। এটি ১০ মিনিটের জন্য বৈধ।`;
    if (settings.smsApiKey && settings.smsApiUrl) {
        try {
            const fetch = require('node-fetch');
            await fetch(`${settings.smsApiUrl}?api_key=${settings.smsApiKey}&type=text&number=${phone}&senderid=${settings.smsSenderId || ''}&message=${encodeURIComponent(smsMsg)}`);
        } catch (_) {}
    }

    const resp = { message: 'OTP পুনরায় পাঠানো হয়েছে' };
    if (process.env.NODE_ENV !== 'production') resp.demo_otp = otp;
    res.json(resp);
});

// ── পাসওয়ার্ড রিসেট অনুরোধ (ফোন নম্বর দিয়ে) ──
router.post('/forgot-password', async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'মোবাইল নম্বর দিন।' });

    const user = db.get('users').find({ phone }).value();
    if (!user) return res.status(404).json({ error: 'এই নম্বরে কোনো অ্যাকাউন্ট নেই।' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const exp = Date.now() + 10 * 60 * 1000;

    // reset OTP আলাদা store-এ রাখি
    db.get('otp_store').remove({ phone, type: 'reset' }).write();
    db.get('otp_store').push({ phone, otp, exp, type: 'reset', userId: user.id }).write();
    console.log(`[RESET OTP] ${phone} → ${otp}`);

    const settings = db.get('settings').value();
    const smsMsg = `বারাকাহ ফাইন্যান্স পাসওয়ার্ড রিসেট OTP: ${otp}। ১০ মিনিটের জন্য বৈধ। কাউকে দেবেন না।`;
    let smsSent = false;
    if (settings.smsApiKey && settings.smsApiUrl) {
        try {
            const fetch = require('node-fetch');
            const smsRes = await fetch(`${settings.smsApiUrl}?api_key=${settings.smsApiKey}&type=text&number=${phone}&senderid=${settings.smsSenderId || ''}&message=${encodeURIComponent(smsMsg)}`);
            const smsData = await smsRes.json();
            smsSent = smsData.response_code === 202 || smsData.error_code === '0';
        } catch (_) {}
    }

    const resp = { message: 'পাসওয়ার্ড রিসেট OTP পাঠানো হয়েছে।', smsSent };
    if (process.env.NODE_ENV !== 'production') resp.demo_otp = otp;
    res.json(resp);
});

// ── পাসওয়ার্ড রিসেট (OTP যাচাই করে নতুন পাসওয়ার্ড) ──
router.post('/reset-password', (req, res) => {
    const { phone, otp, newPassword } = req.body;
    if (!phone || !otp || !newPassword) {
        return res.status(400).json({ error: 'সব তথ্য দিন।' });
    }
    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        return res.status(400).json({ error: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষর, সংখ্যা ও লেটার থাকতে হবে।' });
    }

    const record = db.get('otp_store').find({ phone, type: 'reset' }).value();
    if (!record) return res.status(400).json({ error: 'রিসেট OTP পাওয়া যায়নি।' });
    if (Date.now() > record.exp) {
        db.get('otp_store').remove({ phone, type: 'reset' }).write();
        return res.status(400).json({ error: 'OTP মেয়াদ শেষ।' });
    }
    if (record.otp !== otp.toString()) return res.status(400).json({ error: 'OTP ভুল।' });

    const hash = bcrypt.hashSync(newPassword, 10);
    db.get('users').find({ id: record.userId }).assign({ password: hash, passwordUpdatedAt: new Date().toISOString() }).write();
    db.get('otp_store').remove({ phone, type: 'reset' }).write();

    res.json({ message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।' });
});

// ── ইউজারনেম চেক ──
router.get('/check-username/:username', (req, res) => {
    const exists = !!db.get('users').find({ username: req.params.username }).value();
    res.json({ available: !exists });
});

// ── বর্তমান ব্যবহারকারী ──
router.get('/me', verifyToken, (req, res) => {
    const user = db.get('users').find({ id: req.user.id }).value();
    if (!user) return res.status(404).json({ error: 'পাওয়া যায়নি' });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
});

// ── পাসওয়ার্ড পরিবর্তন ──
router.post('/change-password', verifyToken, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = db.get('users').find({ id: req.user.id }).value();
    if (!bcrypt.compareSync(currentPassword, user.password)) {
        return res.status(400).json({ error: 'বর্তমান পাসওয়ার্ড ভুল' });
    }
    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        return res.status(400).json({ error: 'নতুন পাসওয়ার্ড বৈধ নয়' });
    }
    const hash = bcrypt.hashSync(newPassword, 10);
    db.get('users').find({ id: req.user.id }).assign({ password: hash }).write();
    res.json({ message: 'পাসওয়ার্ড পরিবর্তন হয়েছে' });
});

module.exports = router;