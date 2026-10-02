const express = require('express');
const Commitment = require('../models/Commitment');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/commitments?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.date) {
      const dayOfWeek = new Date(req.query.date + 'T00:00:00').getDay();
      filter.$or = [
        { 'recurrence.type': 'daily' },
        { 'recurrence.type': 'weekly', 'recurrence.daysOfWeek': dayOfWeek },
        { 'recurrence.type': 'none', 'recurrence.specificDate': req.query.date },
        { 'recurrence.type': 'custom', 'recurrence.daysOfWeek': dayOfWeek },
      ];
    }
    const commitments = await Commitment.find(filter).sort({ startTime: 1 });
    res.json({ commitments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/commitments
router.post('/', async (req, res) => {
  try {
    const commitment = await Commitment.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ commitment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/commitments/:id
router.patch('/:id', async (req, res) => {
  try {
    const commitment = await Commitment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true }
    );
    if (!commitment) return res.status(404).json({ error: 'Commitment not found.' });
    res.json({ commitment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/commitments/:id
router.delete('/:id', async (req, res) => {
  try {
    await Commitment.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Commitment deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
