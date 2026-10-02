const mongoose = require('mongoose');

const commitmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  startTime: { type: String, required: true }, // "HH:MM"
  endTime: { type: String, required: true },   // "HH:MM"
  isFixed: { type: Boolean, default: true },   // cannot be moved by scheduler
  color: { type: String, default: '#6366f1' },
  recurrence: {
    type: { type: String, enum: ['none', 'daily', 'weekly', 'custom'], default: 'none' },
    daysOfWeek: [{ type: Number }], // 0=Sun, 1=Mon, ...6=Sat
    specificDate: { type: String, default: null }, // YYYY-MM-DD for non-recurring
  },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Commitment', commitmentSchema);
