// C:\Project\Barakah_Finance\backend\routes\applications.js

const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', verifyToken, requireAdmin, (req, res) => res.json(db.get('applications').value()));
router.post('/', (req, res) => {
    const app = { id: 'BF-' + Date.now().toString(36).toUpperCase(), ...req.body, status: 'pending', submittedAt: new Date().toISOString(), approvals: { committee: [], secretary: false, vicePresident: false, president: false } };
    db.get('applications').push(app).write();
    res.status(201).json(app);
});
router.patch('/:id', verifyToken, requireAdmin, (req, res) => {
    db.get('applications').find({ id: req.params.id }).assign(req.body).write();
    res.json(db.get('applications').find({ id: req.params.id }).value());
});
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
    db.get('applications').remove({ id: req.params.id }).write();
    res.json({ message: 'মুছে দেওয়া হয়েছে' });
});
module.exports = router;