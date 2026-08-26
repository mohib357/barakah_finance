// backend/routes/projects.js — প্রজেক্ট ও ফিক্সড এসেট

const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ════════ PROJECTS ════════

router.get('/', verifyToken, requireAdmin, (req, res) => {
    const projects = db.get('projects').value();
    const enriched = projects.map(p => {
        const investors = db.get('members').filter({ investProject: p.id }).value();
        const income = db.get('ledger').filter({ category: 'project_income', refId: p.id }).value().reduce((s, l) => s + (l.amount || 0), 0);
        const expense = db.get('ledger').filter({ category: 'project_expense', refId: p.id }).value().reduce((s, l) => s + (l.amount || 0), 0);
        return { ...p, investorCount: investors.length, totalIncome: income, totalExpense: expense, netProfit: income - expense };
    });
    res.json({ projects: enriched });
});

router.get('/:id', verifyToken, requireAdmin, (req, res) => {
    const project = db.get('projects').find({ id: req.params.id }).value();
    if (!project) return res.status(404).json({ error: 'পাওয়া যায়নি' });
    const investors = db.get('members').filter({ investProject: req.params.id }).value();
    const ledger = db.get('ledger').filter(l => l.refId === req.params.id).value();
    res.json({ project, investors, ledger });
});

router.post('/', verifyToken, requireAdmin, (req, res) => {
    const { name, type, targetAmount, currentAmount, startDate, endDate, location, maxInvestors, description } = req.body;
    if (!name) return res.status(400).json({ error: 'প্রজেক্টের নাম দিন।' });
    const id = uuidv4();
    const project = {
        id, name, type: type || 'business', targetAmount: parseFloat(targetAmount) || 0,
        currentAmount: parseFloat(currentAmount) || 0, startDate, endDate,
        location: location || '', maxInvestors: parseInt(maxInvestors) || 0,
        description: description || '', status: 'running',
        createdAt: new Date().toISOString(), createdBy: req.user.id
    };
    db.get('projects').push(project).write();
    db.get('audit_log').push({ id: uuidv4(), action: 'CREATE_PROJECT', module: 'projects', recordId: id, newValue: JSON.stringify({ name, targetAmount }), userId: req.user.id, date: new Date().toISOString() }).write();
    res.status(201).json({ project, message: 'প্রজেক্ট তৈরি হয়েছে।' });
});

router.put('/:id', verifyToken, requireAdmin, (req, res) => {
    db.get('projects').find({ id: req.params.id }).assign({ ...req.body, updatedAt: new Date().toISOString() }).write();
    res.json({ message: 'আপডেট হয়েছে।' });
});

// ════════ FIXED ASSETS ════════
router.get('/assets/list', verifyToken, requireAdmin, (req, res) => {
    const assets = db.get('assets').value();
    res.json({ assets });
});

router.post('/assets', verifyToken, requireAdmin, (req, res) => {
    const { name, purchaseDate, purchaseValue, location, responsiblePerson, description } = req.body;
    if (!name) return res.status(400).json({ error: 'এসেটের নাম দিন।' });
    const id = uuidv4();
    const asset = { id, name, purchaseDate, purchaseValue: parseFloat(purchaseValue) || 0, currentValue: parseFloat(purchaseValue) || 0, location: location || '', responsiblePerson: responsiblePerson || '', description: description || '', status: 'active', createdAt: new Date().toISOString() };
    db.get('assets').push(asset).write();
    res.status(201).json({ asset, message: 'এসেট যোগ হয়েছে।' });
});

router.put('/assets/:id', verifyToken, requireAdmin, (req, res) => {
    db.get('assets').find({ id: req.params.id }).assign({ ...req.body, updatedAt: new Date().toISOString() }).write();
    res.json({ message: 'আপডেট হয়েছে।' });
});

module.exports = router;
