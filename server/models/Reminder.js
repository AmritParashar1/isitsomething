const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailySchedule', required: true },
  blockId: { type: mongoose.Schema.Types.ObjectId, required: true },
  blockTitle: { type: String, required: true },
  scheduledFor: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'sent', 'snoozed', 'dismissed', 'missed'],
    default: 'pending'
  },
  userResponse: {
    type: String,
    enum: ['started', 'snoozed', 'missed', null],
    default: null
  },
  snoozedUntil: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);
