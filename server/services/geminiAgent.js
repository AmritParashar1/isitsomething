const { GoogleGenerativeAI } = require('@google/generative-ai');
const Task = require('../models/Task');
const Commitment = require('../models/Commitment');
const DailySchedule = require('../models/DailySchedule');
const ScheduleChangeLog = require('../models/ScheduleChangeLog');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { generateSchedule } = require('./scheduler');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// ─── Tool definitions (Gemini FunctionDeclaration format) ────────────────────

// Tool declarations in Gemini FunctionDeclaration format
const functionDeclarations = [
  {
    name: 'get_user_preferences',
    description: 'Retrieve the user\'s planning preferences (work hours, break durations, reminder settings).',
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'get_today_tasks',
    description: 'Retrieve all tasks for today (pending, scheduled, in_progress). Optionally filter by date.',
    parameters: {
      type: 'OBJECT',
      properties: {
        date: { type: 'STRING', description: 'YYYY-MM-DD, defaults to today' },
      },
    },
  },
  {
    name: 'get_daily_availability',
    description: 'Retrieve fixed commitments and free windows for a given date.',
    parameters: {
      type: 'OBJECT',
      properties: {
        date: { type: 'STRING', description: 'YYYY-MM-DD, defaults to today' },
      },
    },
  },
  {
    name: 'get_current_schedule',
    description: 'Retrieve the latest daily schedule for a given date.',
    parameters: {
      type: 'OBJECT',
      properties: {
        date: { type: 'STRING', description: 'YYYY-MM-DD, defaults to today' },
      },
    },
  },
  {
    name: 'add_task',
    description: 'Add a new task requested by the user. Call once per task.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING' },
        estimatedDuration: { type: 'NUMBER', description: 'Duration in minutes' },
        priority: { type: 'STRING', description: 'low, medium, high, or urgent' },
        mustDo: { type: 'BOOLEAN' },
        deadline: { type: 'STRING', description: 'ISO date string, optional' },
        notes: { type: 'STRING' },
        scheduledDate: { type: 'STRING', description: 'YYYY-MM-DD' },
      },
      required: ['title', 'estimatedDuration'],
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task\'s details or status.',
    parameters: {
      type: 'OBJECT',
      properties: {
        taskId: { type: 'STRING' },
        updates: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            estimatedDuration: { type: 'NUMBER' },
            priority: { type: 'STRING' },
            mustDo: { type: 'BOOLEAN' },
            status: { type: 'STRING' },
            notes: { type: 'STRING' },
          },
        },
      },
      required: ['taskId', 'updates'],
    },
  },
  {
    name: 'generate_daily_schedule',
    description: 'Invoke the scheduling engine to create a time-blocked schedule from today\'s tasks and commitments.',
    parameters: {
      type: 'OBJECT',
      properties: {
        date: { type: 'STRING', description: 'YYYY-MM-DD' },
      },
    },
  },
  {
    name: 'commit_schedule',
    description: 'Save the current schedule as the committed baseline. ONLY call after explicit user confirmation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        date: { type: 'STRING', description: 'YYYY-MM-DD' },
      },
    },
  },
  {
    name: 'log_schedule_event',
    description: 'Log a miss, skip, early completion, or other event BEFORE replanning.',
    parameters: {
      type: 'OBJECT',
      properties: {
        eventType: { type: 'STRING', description: 'missed, skipped, completed_early, added_task, availability_change, manual_edit, or deferred' },
        taskId: { type: 'STRING', description: 'Task ID, if applicable' },
        blockTitle: { type: 'STRING' },
        reason: { type: 'STRING', description: 'Optional user-provided reason' },
        date: { type: 'STRING' },
      },
      required: ['eventType'],
    },
  },
  {
    name: 'reschedule_day',
    description: 'Recalculate the remaining schedule after logging an event. Preserves completed blocks.',
    parameters: {
      type: 'OBJECT',
      properties: {
        date: { type: 'STRING' },
      },
    },
  },
  {
    name: 'set_schedule_blocks',
    description: 'Directly create or update the daily schedule with custom blocks and timings. CRITICAL: You MUST call this tool whenever the user requests or agrees to specific block timings. Never just write text in your reply without calling this tool, otherwise the visual timeline will NOT update.',
    parameters: {
      type: 'OBJECT',
      properties: {
        date: { type: 'STRING', description: 'YYYY-MM-DD, defaults to today' },
        blocks: {
          type: 'ARRAY',
          description: 'The complete list of schedule blocks in chronological order',
          items: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              type: { type: 'STRING', description: 'task, commitment, break, or buffer' },
              startTime: { type: 'STRING', description: 'HH:MM in 24-hour format' },
              endTime: { type: 'STRING', description: 'HH:MM in 24-hour format' },
              durationMinutes: { type: 'NUMBER' },
              taskId: { type: 'STRING', description: 'Task ID if associated with an existing task' },
              isFixed: { type: 'BOOLEAN' },
              color: { type: 'STRING' },
            },
            required: ['title', 'startTime', 'endTime', 'durationMinutes'],
          },
        },
        isCommitted: { type: 'BOOLEAN', description: 'True if user explicitly asked to lock/commit this schedule' },
        note: { type: 'STRING' },
      },
      required: ['blocks'],
    },
  },
  {
    name: 'add_commitment',
    description: 'Add a fixed commitment (e.g. meeting, walk, doctor appointment) for a specific time.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING' },
        startTime: { type: 'STRING', description: 'HH:MM in 24-hour format' },
        endTime: { type: 'STRING', description: 'HH:MM in 24-hour format' },
        date: { type: 'STRING', description: 'YYYY-MM-DD, defaults to today' },
        notes: { type: 'STRING' },
      },
      required: ['title', 'startTime', 'endTime'],
    },
  },
  {
    name: 'get_progress_summary',
    description: 'Get planned vs actual progress for a date.',
    parameters: {
      type: 'OBJECT',
      properties: {
        date: { type: 'STRING' },
      },
    },
  },
];

// ─── Tool executor ────────────────────────────────────────────────────────────

async function executeTool(name, args, userId) {
  const today = new Date().toISOString().slice(0, 10);
  const date = args.date || today;

  switch (name) {
    case 'get_user_preferences': {
      const user = await User.findById(userId).select('preferences name timezone');
      return { preferences: user.preferences, name: user.name, timezone: user.timezone };
    }

    case 'get_today_tasks': {
      const tasks = await Task.find({
        userId,
        $or: [{ scheduledDate: date }, { scheduledDate: null, status: { $in: ['pending', 'scheduled', 'in_progress'] } }],
        status: { $nin: ['completed', 'deferred'] },
      });
      return { tasks, count: tasks.length };
    }

    case 'get_daily_availability': {
      const user = await User.findById(userId).select('preferences');
      const dayOfWeek = new Date(date + 'T00:00:00').getDay();
      const commitments = await Commitment.find({
        userId,
        $or: [
          { 'recurrence.type': 'daily' },
          { 'recurrence.type': 'weekly', 'recurrence.daysOfWeek': dayOfWeek },
          { 'recurrence.type': 'none', 'recurrence.specificDate': date },
          { 'recurrence.type': 'custom', 'recurrence.daysOfWeek': dayOfWeek },
        ],
      });
      return { commitments, preferences: user.preferences, date };
    }

    case 'get_current_schedule': {
      const schedule = await DailySchedule.findOne({ userId, date })
        .sort({ version: -1 })
        .populate('unscheduledTasks');
      return { schedule };
    }

    case 'add_task': {
      const task = await Task.create({
        userId,
        title: args.title,
        estimatedDuration: args.estimatedDuration,
        priority: args.priority || 'medium',
        mustDo: args.mustDo || false,
        deadline: args.deadline || null,
        notes: args.notes || '',
        scheduledDate: args.scheduledDate || date,
        status: 'pending',
      });
      return { task, message: `Task "${task.title}" added successfully.` };
    }

    case 'update_task': {
      const task = await Task.findOneAndUpdate(
        { _id: args.taskId, userId },
        { $set: args.updates },
        { new: true }
      );
      if (!task) return { error: 'Task not found' };
      return { task, message: `Task "${task.title}" updated.` };
    }

    case 'generate_daily_schedule': {
      const user = await User.findById(userId).select('preferences');
      const tasks = await Task.find({
        userId,
        $or: [{ scheduledDate: date }, { scheduledDate: null }],
        status: { $nin: ['completed', 'deferred'] },
      });
      const dayOfWeek = new Date(date + 'T00:00:00').getDay();
      const commitments = await Commitment.find({
        userId,
        $or: [
          { 'recurrence.type': 'daily' },
          { 'recurrence.type': 'weekly', 'recurrence.daysOfWeek': dayOfWeek },
          { 'recurrence.type': 'none', 'recurrence.specificDate': date },
          { 'recurrence.type': 'custom', 'recurrence.daysOfWeek': dayOfWeek },
        ],
      });

      const existingSchedule = await DailySchedule.findOne({ userId, date }).sort({ version: -1 });
      const completedBlocks = existingSchedule
        ? existingSchedule.blocks.filter(b => b.status === 'completed')
        : [];

      const result = generateSchedule({ tasks, commitments, preferences: user.preferences, date, completedBlocks });

      const version = existingSchedule ? existingSchedule.version + 1 : 1;
      const schedule = await DailySchedule.create({
        userId, date, version, type: 'proposal',
        blocks: result.blocks,
        unscheduledTasks: result.unscheduledTasks,
        unscheduledReasons: result.unscheduledReasons,
        totalScheduledMinutes: result.totalScheduled,
        totalAvailableMinutes: result.totalAvailable,
        overloaded: result.overloaded,
        generationNote: result.note,
      });

      for (const block of result.blocks) {
        if (block.taskId) {
          await Task.findByIdAndUpdate(block.taskId, { status: 'scheduled', scheduledDate: date });
        }
      }

      return { schedule, note: result.note, unscheduledCount: result.unscheduledTasks.length };
    }

    case 'commit_schedule': {
      const schedule = await DailySchedule.findOne({ userId, date }).sort({ version: -1 });
      if (!schedule) return { error: 'No schedule found for today.' };
      schedule.isCommitted = true;
      schedule.committedAt = new Date();
      schedule.type = 'committed';
      await schedule.save();
      return { schedule, message: '✅ Plan committed! Your schedule is now locked as the baseline.' };
    }

    case 'log_schedule_event': {
      const log = await ScheduleChangeLog.create({
        userId,
        date: args.date || today,
        eventType: args.eventType,
        taskId: args.taskId || null,
        blockTitle: args.blockTitle || null,
        reason: args.reason || null,
      });
      if (args.taskId) {
        const statusMap = { missed: 'missed', skipped: 'missed', deferred: 'deferred', completed_early: 'completed' };
        if (statusMap[args.eventType]) {
          const updateData = { status: statusMap[args.eventType] };
          if (args.eventType === 'deferred') updateData['$inc'] = { deferralCount: 1 };
          await Task.findByIdAndUpdate(args.taskId, updateData);
        }
      }
      return { log, message: `Event "${args.eventType}" logged.` };
    }

    case 'reschedule_day': {
      const user = await User.findById(userId).select('preferences');
      const tasks = await Task.find({
        userId, scheduledDate: date,
        status: { $nin: ['completed', 'deferred', 'missed'] },
      });
      const dayOfWeek = new Date(date + 'T00:00:00').getDay();
      const commitments = await Commitment.find({
        userId,
        $or: [
          { 'recurrence.type': 'daily' },
          { 'recurrence.type': 'weekly', 'recurrence.daysOfWeek': dayOfWeek },
          { 'recurrence.type': 'none', 'recurrence.specificDate': date },
        ],
      });
      const existingSchedule = await DailySchedule.findOne({ userId, date }).sort({ version: -1 });
      const completedBlocks = existingSchedule
        ? existingSchedule.blocks.filter(b => b.status === 'completed')
        : [];

      const result = generateSchedule({ tasks, commitments, preferences: user.preferences, date, completedBlocks });
      const committedBaseline = await DailySchedule.findOne({ userId, date, isCommitted: true });
      const version = (existingSchedule?.version || 0) + 1;

      const schedule = await DailySchedule.create({
        userId, date, version, type: 'revision',
        baselineScheduleId: committedBaseline?._id || null,
        blocks: result.blocks,
        unscheduledTasks: result.unscheduledTasks,
        unscheduledReasons: result.unscheduledReasons,
        totalScheduledMinutes: result.totalScheduled,
        totalAvailableMinutes: result.totalAvailable,
        overloaded: result.overloaded,
        generationNote: result.note,
      });
      return { schedule, note: result.note };
    }

    case 'get_progress_summary': {
      const schedule = await DailySchedule.findOne({ userId, date, isCommitted: true });
      const logs = await ScheduleChangeLog.find({ userId, date });
      if (!schedule) return { message: 'No committed schedule found for this date.' };
      const taskBlocks = schedule.blocks.filter(b => b.type === 'task');
      const completed = taskBlocks.filter(b => b.status === 'completed').length;
      const missed = taskBlocks.filter(b => b.status === 'missed').length;
      const pending = taskBlocks.filter(b => b.status === 'pending').length;
      return {
        date, total: taskBlocks.length, completed, missed, pending,
        completionRate: taskBlocks.length ? Math.round((completed / taskBlocks.length) * 100) : 0,
        changeEvents: logs.length, logs,
      };
    }

    case 'set_schedule_blocks': {
      const existingSchedule = await DailySchedule.findOne({ userId, date }).sort({ version: -1 });
      const committedBaseline = await DailySchedule.findOne({ userId, date, isCommitted: true });
      const version = (existingSchedule?.version || 0) + 1;

      const totalScheduled = args.blocks.reduce((acc, b) => acc + (b.durationMinutes || 0), 0);

      const formattedBlocks = args.blocks.map(b => ({
        taskId: b.taskId || null,
        title: b.title,
        type: b.type || (b.taskId ? 'task' : 'break'),
        startTime: b.startTime,
        endTime: b.endTime,
        durationMinutes: b.durationMinutes,
        status: b.status || 'pending',
        color: b.color || (b.type === 'commitment' ? '#8b5cf6' : b.type === 'break' ? '#374151' : '#6366f1'),
        isFixed: !!b.isFixed || b.type === 'commitment',
      }));

      const schedule = await DailySchedule.create({
        userId,
        date,
        version,
        type: args.isCommitted ? 'committed' : (committedBaseline ? 'revision' : 'proposal'),
        isCommitted: !!args.isCommitted,
        committedAt: args.isCommitted ? new Date() : null,
        baselineScheduleId: committedBaseline?._id || null,
        blocks: formattedBlocks,
        totalScheduledMinutes: totalScheduled,
        totalAvailableMinutes: 1440,
        generationNote: args.note || 'Custom schedule updated by AI assistant',
      });

      for (const block of formattedBlocks) {
        if (block.taskId) {
          await Task.findByIdAndUpdate(block.taskId, { status: 'scheduled', scheduledDate: date });
        }
      }

      return { schedule, message: `✅ Schedule updated with ${formattedBlocks.length} blocks.` };
    }

    case 'add_commitment': {
      const commitment = await Commitment.create({
        userId,
        title: args.title,
        startTime: args.startTime,
        endTime: args.endTime,
        isFixed: true,
        recurrence: {
          type: 'none',
          specificDate: date,
        },
        notes: args.notes || '',
      });
      return { commitment, message: `Commitment "${commitment.title}" (${args.startTime} - ${args.endTime}) added.` };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─── Main agent function ──────────────────────────────────────────────────────

async function runAgent(userId, userMessage, date) {
  const today = date || new Date().toISOString().slice(0, 10);

  // Load or create conversation
  let conversation = await Conversation.findOne({ userId, date: today });
  if (!conversation) {
    conversation = await Conversation.create({ userId, date: today, messages: [] });
  }

  const systemInstruction = `You are an AI daily planning assistant. Your job is to help the user plan, manage, and adapt their daily schedule.

CRITICAL RULES FOR SCHEDULE MODIFICATIONS:
- Whenever the user asks for or agrees to specific timings (e.g. "DSA from 10:30 PM", "take a walk from 10:00 to 10:30", "push bedtime to 2 AM"), you MUST call the set_schedule_blocks tool with the actual block objects (title, startTime, endTime, durationMinutes, type, taskId if matching an existing task).
- NEVER just print a markdown schedule table in your text reply without calling set_schedule_blocks or generate_daily_schedule. If you do not call the tool, the database and user's visual timeline will NOT update!
- When the user confirms with "yes", "lock it in", or asks to commit, call set_schedule_blocks with isCommitted: true or call commit_schedule.
- DO NOT create standalone 'break' blocks unless the user explicitly asks for one. Keep the schedule clean, containing only actual tasks and commitments (breaks naturally exist in the gap between blocks).
- When the user mentions fixed events (walks, meetings, dinners), use add_commitment or include them as commitment blocks in set_schedule_blocks.
- When the user gives you tasks, use add_task.
- Always get_current_schedule before making modifications.
- ALWAYS log_schedule_event BEFORE calling reschedule_day when reporting a miss/skip.
- Be concise, friendly, and practical.
- Today's date is ${today}.`;

  const toolCallsMade = [];

  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction,
    tools: [{ functionDeclarations }],
    generationConfig: { temperature: 0.4 },
  });

  // Build the contents array for generateContent directly
  // (avoids SDK's internal 'function' role issues with startChat)
  const contents = conversation.messages
    .filter(m => (m.role === 'user' || m.role === 'model') && m.content && m.content.trim())
    .map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Add the current user message
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  // Save user message to conversation
  conversation.messages.push({ role: 'user', content: userMessage });

  // Agentic loop using generateContent directly
  while (true) {
    const result = await model.generateContent({ contents });
    const response = result.response;
    const candidate = response.candidates[0];
    const parts = candidate.content.parts;

    const fnCalls = parts.filter(p => p.functionCall);

    if (fnCalls.length === 0) {
      // Final text answer — no more tool calls
      const assistantText = response.text();

      conversation.messages.push({
        role: 'model',
        content: assistantText,
        toolCalls: toolCallsMade,
      });
      await conversation.save();

      return { message: assistantText, toolCalls: toolCallsMade };
    }

    // Add the model's function-call turn to contents
    contents.push({ role: 'model', parts });

    // Execute all function calls and collect results
    const functionResponseParts = [];
    for (const part of fnCalls) {
      const { name, args } = part.functionCall;
      const toolResult = await executeTool(name, args || {}, userId);
      toolCallsMade.push({ name, args, result: toolResult });

      functionResponseParts.push({
        functionResponse: {
          name,
          response: { content: JSON.stringify(toolResult) },
        },
      });
    }

    // Add function results as a user turn and loop again
    contents.push({ role: 'user', parts: functionResponseParts });
  }
}

module.exports = { runAgent };
