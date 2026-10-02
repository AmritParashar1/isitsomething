const express = require('express');
const { runAgent } = require('../services/geminiAgent');
const Conversation = require('../models/Conversation');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// POST /api/agent/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, date } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required.' });

    const result = await runAgent(req.user._id.toString(), message, date);
    res.json(result);
  } catch (err) {
    console.error('Agent error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agent/history?date=YYYY-MM-DD
router.get('/history', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const conversation = await Conversation.findOne({ userId: req.user._id, date });
    res.json({ messages: conversation?.messages || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/agent/history?date=YYYY-MM-DD  (clear chat)
router.delete('/history', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    await Conversation.findOneAndUpdate({ userId: req.user._id, date }, { $set: { messages: [] } });
    res.json({ message: 'Chat cleared.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
