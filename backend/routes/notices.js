// C:\Project\Barakah_Finance\backend\routes\notices.js

const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', (req, res) => res.json(db.get('notices').value()));
router.post('/', verifyToken, requireAdmin, (req, res) => {
    const n = { id: uuidv4(), ...req.body };
    db.get('notices').push(n).write();
    res.status(201).json(n);
});
router.put('/:id', verifyToken, requireAdmin, (req, res) => {
    db.get('notices').find({ id: req.params.id }).assign(req.body).write();
    res.json(db.get('notices').find({ id: req.params.id }).value());
});
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
    db.get('notices').remove({ id: req.params.id }).write();
    res.json({ message: 'মুছে দেওয়া হয়েছে' });
});
module.exports = router;