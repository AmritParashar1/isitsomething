const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  estimatedDuration: { type: Number, required: true, default: 60 }, // minutes
  actualDuration: { type: Number, default: null },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  mustDo: { type: Boolean, default: false },
  deadline: { type: Date, default: null },
  goalAssociation: { type: String, default: null },
  splittable: { type: Boolean, default: false },
  minSessionDuration: { type: Number, default: 25 }, // minutes
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'in_progress', 'completed', 'missed', 'deferred'],
    default: 'pending'
  },
  deferralCount: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  scheduledDate: { type: String, default: null }, // YYYY-MM-DD
  tags: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
