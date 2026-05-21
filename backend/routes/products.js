// C:\Project\Barakah_Finance\backend\routes\products.js
const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', (req, res) => res.json(db.get('products').value()));
router.post('/', verifyToken, requireAdmin, (req, res) => {
    const p = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
    db.get('products').push(p).write();
    res.status(201).json(p);
});
router.put('/:id', verifyToken, requireAdmin, (req, res) => {
    db.get('products').find({ id: req.params.id }).assign(req.body).write();
    res.json(db.get('products').find({ id: req.params.id }).value());
});
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
    db.get('products').remove({ id: req.params.id }).write();
    res.json({ message: 'মুছে দেওয়া হয়েছে' });
});
module.exports = router;