const mongoose = require('mongoose');

const scheduleBlockSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  commitmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commitment', default: null },
  title: { type: String, required: true },
  type: { type: String, enum: ['task', 'commitment', 'break', 'buffer'], default: 'task' },
  startTime: { type: String, required: true }, // "HH:MM"
  endTime: { type: String, required: true },   // "HH:MM"
  durationMinutes: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'missed', 'skipped', 'deferred'],
    default: 'pending'
  },
  actualStartTime: { type: String, default: null },
  actualEndTime: { type: String, default: null },
  color: { type: String, default: '#6366f1' },
  isFixed: { type: Boolean, default: false },
}, { _id: true });

const dailyScheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  version: { type: Number, default: 1 },
  type: {
    type: String,
    enum: ['proposal', 'committed', 'revision'],
    default: 'proposal'
  },
  isCommitted: { type: Boolean, default: false },
  committedAt: { type: Date, default: null },
  baselineScheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailySchedule', default: null },
  blocks: [scheduleBlockSchema],
  unscheduledTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  unscheduledReasons: [{ taskId: mongoose.Schema.Types.ObjectId, reason: String }],
  totalScheduledMinutes: { type: Number, default: 0 },
  totalAvailableMinutes: { type: Number, default: 0 },
  overloaded: { type: Boolean, default: false },
  generationNote: { type: String, default: '' },
}, { timestamps: true });

dailyScheduleSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('DailySchedule', dailyScheduleSchema);
