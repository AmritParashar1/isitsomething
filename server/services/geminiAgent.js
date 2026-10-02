const Groq = require('groq-sdk');
const Task = require('../models/Task');
const Commitment = require('../models/Commitment');
const DailySchedule = require('../models/DailySchedule');
const ScheduleChangeLog = require('../models/ScheduleChangeLog');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { generateSchedule } = require('./scheduler');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';

// ─── Tool definitions (OpenAI function-calling format) ───────────────────────

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_user_preferences',
      description: 'Retrieve the user\'s planning preferences (work hours, break durations, reminder settings).',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_today_tasks',
      description: 'Retrieve all tasks for today (pending, scheduled, in_progress). Optionally filter by date.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD, defaults to today' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_daily_availability',
      description: 'Retrieve fixed commitments and free windows for a given date.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD, defaults to today' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_current_schedule',
      description: 'Retrieve the latest daily schedule for a given date.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD, defaults to today' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_task',
      description: 'Add a new task requested by the user. Call once per task.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          estimatedDuration: { type: 'number', description: 'Duration in minutes' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          mustDo: { type: 'boolean' },
          deadline: { type: 'string', description: 'ISO date string, optional' },
          notes: { type: 'string' },
          scheduledDate: { type: 'string', description: 'YYYY-MM-DD' },
        },
        required: ['title', 'estimatedDuration'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_task',
      description: 'Update an existing task\'s details or status.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
          updates: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              estimatedDuration: { type: 'number' },
              priority: { type: 'string' },
              mustDo: { type: 'boolean' },
              status: { type: 'string' },
              notes: { type: 'string' },
            },
          },
        },
        required: ['taskId', 'updates'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_daily_schedule',
      description: 'Invoke the scheduling engine to create a time-blocked schedule from today\'s tasks and commitments.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'commit_schedule',
      description: 'Save the current schedule as the committed baseline. ONLY call after explicit user confirmation.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_schedule_event',
      description: 'Log a miss, skip, early completion, or other event BEFORE replanning.',
      parameters: {
        type: 'object',
        properties: {
          eventType: {
            type: 'string',
            enum: ['missed', 'skipped', 'completed_early', 'added_task', 'availability_change', 'manual_edit', 'deferred'],
          },
          taskId: { type: 'string', description: 'Task ID, if applicable' },
          blockTitle: { type: 'string' },
          reason: { type: 'string', description: 'Optional user-provided reason' },
          date: { type: 'string' },
        },
        required: ['eventType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reschedule_day',
      description: 'Recalculate the remaining schedule after logging an event. Preserves completed blocks.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_schedule_blocks',
      description: 'Directly create or update the daily schedule with custom blocks and timings. CRITICAL: You MUST call this tool whenever the user requests or agrees to specific block timings (e.g. "start DSA at 10:30 PM", "take a walk from 10:00 to 10:30"). Never just write text in your reply without calling this tool, otherwise the visual timeline will NOT update.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD, defaults to today' },
          blocks: {
            type: 'array',
            description: 'The complete list of schedule blocks for the day in chronological order',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                type: { type: 'string', enum: ['task', 'commitment', 'break', 'buffer'] },
                startTime: { type: 'string', description: 'HH:MM in 24-hour format, e.g. 22:30, 00:40' },
                endTime: { type: 'string', description: 'HH:MM in 24-hour format, e.g. 00:30, 01:40' },
                durationMinutes: { type: 'number' },
                taskId: { type: 'string', description: 'Task ID if associated with an existing task' },
                isFixed: { type: 'boolean' },
                color: { type: 'string' },
              },
              required: ['title', 'startTime', 'endTime', 'durationMinutes'],
            },
          },
          isCommitted: { type: 'boolean', description: 'True if user explicitly asked to lock/commit this schedule' },
          note: { type: 'string' },
        },
        required: ['blocks'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_commitment',
      description: 'Add a fixed commitment (e.g. meeting, walk, doctor appointment) for a specific time.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          startTime: { type: 'string', description: 'HH:MM in 24-hour format' },
          endTime: { type: 'string', description: 'HH:MM in 24-hour format' },
          date: { type: 'string', description: 'YYYY-MM-DD, defaults to today' },
          notes: { type: 'string' },
        },
        required: ['title', 'startTime', 'endTime'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_progress_summary',
      description: 'Get planned vs actual progress for a date.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string' },
        },
        required: [],
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

  const systemPrompt = `You are an AI daily planning assistant. Your job is to help the user plan, manage, and adapt their daily schedule.

CRITICAL RULES FOR SCHEDULE MODIFICATIONS:
- Whenever the user asks for or agrees to specific timings (e.g. "DSA from 10:30 PM", "take a walk from 10:00 to 10:30", "push bedtime to 2 AM"), you MUST call the set_schedule_blocks tool with the actual block objects (title, startTime, endTime, durationMinutes, type, taskId if matching an existing task).
- NEVER just print a markdown schedule table in your text reply without calling set_schedule_blocks or generate_daily_schedule. If you do not call the tool, the database and user's visual timeline will NOT update!
- When the user confirms with "yes", "lock it in", or asks to commit, call set_schedule_blocks with isCommitted: true or call commit_schedule.
- When the user mentions fixed events (walks, meetings, dinners), use add_commitment or include them as commitment/break blocks in set_schedule_blocks.
- When the user gives you tasks, use add_task.
- Always get_current_schedule before making modifications.
- ALWAYS log_schedule_event BEFORE calling reschedule_day when reporting a miss/skip.
- Be concise, friendly, and practical.
- Today's date is ${today}.`;

  // Build message history
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversation.messages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  // Save user message
  conversation.messages.push({ role: 'user', content: userMessage });

  const toolCallsMade = [];

  // Agentic loop
  let continueLoop = true;
  while (continueLoop) {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.6,
    });

    const choice = response.choices[0];
    const assistantMsg = choice.message;

    // Add assistant message to history
    messages.push(assistantMsg);

    if (choice.finish_reason === 'tool_calls' && assistantMsg.tool_calls?.length > 0) {
      // Execute all tool calls
      const toolResultMessages = [];

      for (const toolCall of assistantMsg.tool_calls) {
        let args = {};
        try { args = JSON.parse(toolCall.function.arguments || '{}'); } catch {}

        const result = await executeTool(toolCall.function.name, args, userId);
        toolCallsMade.push({ name: toolCall.function.name, args, result });

        toolResultMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      // Add all tool results to message history
      messages.push(...toolResultMessages);
    } else {
      // No more tool calls — we have the final answer
      continueLoop = false;
      const assistantText = assistantMsg.content || '';

      conversation.messages.push({
        role: 'model',
        content: assistantText,
        toolCalls: toolCallsMade,
      });
      await conversation.save();

      return { message: assistantText, toolCalls: toolCallsMade };
    }
  }
}

module.exports = { runAgent };
