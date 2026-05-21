// C:\Project\Barakah_Finance\backend\routes\orders.js
const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', verifyToken, requireAdmin, (req, res) => res.json(db.get('orders').value()));
router.get('/user/:phone', verifyToken, (req, res) => {
    res.json(db.get('orders').filter({ customerPhone: req.params.phone }).value());
});
router.post('/', (req, res) => {
    const o = { id: 'ORD-' + Date.now().toString(36).toUpperCase(), ...req.body, status: 'pending', statusStep: 0, submittedAt: new Date().toISOString() };
    db.get('orders').push(o).write();
    res.status(201).json(o);
});
router.patch('/:id', verifyToken, requireAdmin, (req, res) => {
    db.get('orders').find({ id: req.params.id }).assign(req.body).write();
    res.json(db.get('orders').find({ id: req.params.id }).value());
});
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
    db.get('orders').remove({ id: req.params.id }).write();
    res.json({ message: 'মুছে দেওয়া হয়েছে' });
});
module.exports = router;