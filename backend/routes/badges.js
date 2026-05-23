// C:\Project\Barakah_Finance\backend\routes\badges.js

const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', (req, res) => res.json(db.get('badges').value()));
router.post('/', verifyToken, requireAdmin, (req, res) => {
    const b = { id: uuidv4(), ...req.body };
    db.get('badges').push(b).write();
    res.status(201).json(b);
});
router.put('/:id', verifyToken, requireAdmin, (req, res) => {
    db.get('badges').find({ id: req.params.id }).assign(req.body).write();
    res.json(db.get('badges').find({ id: req.params.id }).value());
});
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
    db.get('badges').remove({ id: req.params.id }).write();
    res.json({ message: 'মুছে দেওয়া হয়েছে' });
});
module.exports = router;