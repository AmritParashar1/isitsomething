const express = require('express');
const DailySchedule = require('../models/DailySchedule');
const Task = require('../models/Task');
const Commitment = require('../models/Commitment');
const ScheduleChangeLog = require('../models/ScheduleChangeLog');
const { protect } = require('../middleware/auth');
const { generateSchedule } = require('../services/scheduler');

const router = express.Router();
router.use(protect);

// GET /api/schedules?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const schedule = await DailySchedule.findOne({ userId: req.user._id, date })
      .sort({ version: -1 })
      .populate('unscheduledTasks');
    res.json({ schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/schedules/history?date=YYYY-MM-DD
router.get('/history', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const schedules = await DailySchedule.find({ userId: req.user._id, date }).sort({ version: 1 });
    res.json({ schedules });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/schedules/generate
router.post('/generate', async (req, res) => {
  try {
    const date = req.body.date || new Date().toISOString().slice(0, 10);
    const user = req.user;
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();

    const [tasks, commitments] = await Promise.all([
      Task.find({
        userId: user._id,
        $or: [{ scheduledDate: date }, { scheduledDate: null }],
        status: { $nin: ['completed', 'deferred'] },
      }),
      Commitment.find({
        userId: user._id,
        $or: [
          { 'recurrence.type': 'daily' },
          { 'recurrence.type': 'weekly', 'recurrence.daysOfWeek': dayOfWeek },
          { 'recurrence.type': 'none', 'recurrence.specificDate': date },
          { 'recurrence.type': 'custom', 'recurrence.daysOfWeek': dayOfWeek },
        ],
      }),
    ]);

    const existingSchedule = await DailySchedule.findOne({ userId: user._id, date }).sort({ version: -1 });
    const completedBlocks = existingSchedule
      ? existingSchedule.blocks.filter(b => b.status === 'completed')
      : [];

    const result = generateSchedule({
      tasks,
      commitments,
      preferences: user.preferences,
      date,
      completedBlocks,
    });

    const version = existingSchedule ? existingSchedule.version + 1 : 1;
    const schedule = await DailySchedule.create({
      userId: user._id,
      date,
      version,
      type: 'proposal',
      blocks: result.blocks,
      unscheduledTasks: result.unscheduledTasks,
      unscheduledReasons: result.unscheduledReasons,
      totalScheduledMinutes: result.totalScheduled,
      totalAvailableMinutes: result.totalAvailable,
      overloaded: result.overloaded,
      generationNote: result.note,
    });

    // Update task statuses to scheduled
    for (const block of result.blocks) {
      if (block.taskId) {
        await Task.findByIdAndUpdate(block.taskId, { status: 'scheduled', scheduledDate: date });
      }
    }

    res.status(201).json({ schedule, note: result.note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/schedules/commit
router.post('/commit', async (req, res) => {
  try {
    const date = req.body.date || new Date().toISOString().slice(0, 10);
    const schedule = await DailySchedule.findOne({ userId: req.user._id, date })
      .sort({ version: -1 });
    if (!schedule) return res.status(404).json({ error: 'No schedule found to commit.' });

    schedule.isCommitted = true;
    schedule.committedAt = new Date();
    schedule.type = 'committed';
    await schedule.save();
    res.json({ schedule, message: '✅ Plan committed!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/schedules/:scheduleId/blocks/:blockId
router.patch('/:scheduleId/blocks/:blockId', async (req, res) => {
  try {
    const schedule = await DailySchedule.findOne({ _id: req.params.scheduleId, userId: req.user._id });
    if (!schedule) return res.status(404).json({ error: 'Schedule not found.' });

    const block = schedule.blocks.id(req.params.blockId);
    if (!block) return res.status(404).json({ error: 'Block not found.' });

    Object.assign(block, req.body);

    // Log manual edit
    await ScheduleChangeLog.create({
      userId: req.user._id,
      date: schedule.date,
      eventType: 'manual_edit',
      blockTitle: block.title,
      scheduleId: schedule._id,
    });

    await schedule.save();
    res.json({ block, schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/schedules/reschedule
router.post('/reschedule', async (req, res) => {
  try {
    const date = req.body.date || new Date().toISOString().slice(0, 10);
    const user = req.user;
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();

    const [tasks, commitments, existingSchedule] = await Promise.all([
      Task.find({
        userId: user._id,
        scheduledDate: date,
        status: { $nin: ['completed', 'deferred', 'missed'] },
      }),
      Commitment.find({
        userId: user._id,
        $or: [
          { 'recurrence.type': 'daily' },
          { 'recurrence.type': 'weekly', 'recurrence.daysOfWeek': dayOfWeek },
          { 'recurrence.type': 'none', 'recurrence.specificDate': date },
        ],
      }),
      DailySchedule.findOne({ userId: user._id, date }).sort({ version: -1 }),
    ]);

    const completedBlocks = existingSchedule
      ? existingSchedule.blocks.filter(b => b.status === 'completed')
      : [];

    const result = generateSchedule({
      tasks,
      commitments,
      preferences: user.preferences,
      date,
      completedBlocks,
    });

    const committedBaseline = await DailySchedule.findOne({ userId: user._id, date, isCommitted: true });
    const version = (existingSchedule?.version || 0) + 1;

    const schedule = await DailySchedule.create({
      userId: user._id,
      date,
      version,
      type: 'revision',
      baselineScheduleId: committedBaseline?._id || null,
      blocks: result.blocks,
      unscheduledTasks: result.unscheduledTasks,
      unscheduledReasons: result.unscheduledReasons,
      totalScheduledMinutes: result.totalScheduled,
      totalAvailableMinutes: result.totalAvailable,
      overloaded: result.overloaded,
      generationNote: result.note,
    });

    res.status(201).json({ schedule, note: result.note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/schedules/logs?date=YYYY-MM-DD
router.get('/logs', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const logs = await ScheduleChangeLog.find({ userId: req.user._id, date })
      .populate('taskId', 'title')
      .sort({ createdAt: 1 });
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/schedules/log-event
router.post('/log-event', async (req, res) => {
  try {
    const { eventType, taskId, blockTitle, reason, date } = req.body;
    const logDate = date || new Date().toISOString().slice(0, 10);
    const log = await ScheduleChangeLog.create({
      userId: req.user._id,
      date: logDate,
      eventType,
      taskId: taskId || null,
      blockTitle: blockTitle || null,
      reason: reason || null,
    });

    if (taskId) {
      const statusMap = { missed: 'missed', skipped: 'missed', deferred: 'deferred', completed_early: 'completed' };
      if (statusMap[eventType]) {
        const updateData = { status: statusMap[eventType] };
        if (eventType === 'deferred') updateData['$inc'] = { deferralCount: 1 };
        await Task.findByIdAndUpdate(taskId, updateData);
      }
    }

    res.status(201).json({ log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/schedules/progress?date=YYYY-MM-DD
router.get('/progress', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const schedule = await DailySchedule.findOne({ userId: req.user._id, date, isCommitted: true });
    const logs = await ScheduleChangeLog.find({ userId: req.user._id, date });

    if (!schedule) return res.json({ message: 'No committed schedule.', date });

    const taskBlocks = schedule.blocks.filter(b => b.type === 'task');
    const completed = taskBlocks.filter(b => b.status === 'completed').length;
    const missed = taskBlocks.filter(b => b.status === 'missed').length;
    const pending = taskBlocks.filter(b => b.status === 'pending').length;

    res.json({
      date,
      total: taskBlocks.length,
      completed,
      missed,
      pending,
      completionRate: taskBlocks.length ? Math.round((completed / taskBlocks.length) * 100) : 0,
      logs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
