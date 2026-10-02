const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  timezone: { type: String, default: 'Asia/Kolkata' },
  preferences: {
    dayStartTime: { type: String, default: '06:00' },
    dayEndTime: { type: String, default: '23:00' },
    workStartTime: { type: String, default: '09:00' },
    workEndTime: { type: String, default: '21:00' },
    defaultTaskDuration: { type: Number, default: 60 }, // minutes
    breakDuration: { type: Number, default: 10 },       // minutes between tasks
    longBreakDuration: { type: Number, default: 30 },   // minutes for lunch etc.
    reminderLeadTime: { type: Number, default: 5 },     // minutes before block
    quietHoursStart: { type: String, default: '22:00' },
    quietHoursEnd: { type: String, default: '07:00' },
    enableReminders: { type: Boolean, default: true },
    enableMorningPrompt: { type: Boolean, default: true },
    morningPromptTime: { type: String, default: '08:00' },
  },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
