const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'model'], required: true },
  content: { type: String, required: true },
  toolCalls: [{ type: mongoose.Schema.Types.Mixed }],
  timestamp: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  messages: [messageSchema],
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailySchedule', default: null },
}, { timestamps: true });

conversationSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
