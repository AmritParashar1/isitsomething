const mongoose = require('mongoose');

const changeLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  eventType: {
    type: String,
    enum: ['missed', 'skipped', 'completed_early', 'added_task', 'availability_change', 'manual_edit', 'deferred'],
    required: true
  },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  blockTitle: { type: String, default: null },
  reason: { type: String, default: null },
  scheduleVersionBefore: { type: Number, default: null },
  scheduleVersionAfter: { type: Number, default: null },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailySchedule', default: null },
}, { timestamps: true });

module.exports = mongoose.model('ScheduleChangeLog', changeLogSchema);
