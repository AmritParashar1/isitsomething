/**
 * Constraint-based daily scheduling engine.
 * Takes tasks, commitments, and preferences, returns a time-blocked schedule.
 */

// Convert "HH:MM" to minutes since midnight
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Convert minutes since midnight to "HH:MM"
function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function priorityScore(task) {
  const scores = { urgent: 4, high: 3, medium: 2, low: 1 };
  let score = scores[task.priority] || 2;
  if (task.mustDo) score += 10;
  if (task.deadline) {
    const daysUntil = (new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24);
    if (daysUntil <= 1) score += 5;
    else if (daysUntil <= 3) score += 3;
    else if (daysUntil <= 7) score += 1;
  }
  return score;
}

/**
 * Main scheduling function.
 * @param {Object} options
 * @param {Array}  options.tasks          - Task objects to schedule
 * @param {Array}  options.commitments    - Fixed commitment objects for the day
 * @param {Object} options.preferences   - User preferences
 * @param {String} options.date          - YYYY-MM-DD
 * @param {Array}  options.completedBlockIds - block IDs already completed (preserve them)
 * @returns {{ blocks, unscheduledTasks, unscheduledReasons, totalScheduled, totalAvailable, overloaded, note }}
 */
function generateSchedule({ tasks, commitments, preferences, date, completedBlocks = [] }) {
  const dayStart = timeToMinutes(preferences.workStartTime || '09:00');
  const dayEnd   = timeToMinutes(preferences.workEndTime   || '21:00');
  const breakDur = preferences.breakDuration     || 10;
  const bufferDur = 5; // transition buffer in minutes

  // --- 1. Build fixed blocks from commitments ---
  const fixedBlocks = [];

  // Add completed blocks first (preserve them)
  for (const cb of completedBlocks) {
    fixedBlocks.push({ ...cb, isFixed: true });
  }

  // Add commitments that apply today
  const dayOfWeek = new Date(date + 'T00:00:00').getDay();
  for (const c of commitments) {
    const applies =
      c.recurrence.type === 'daily' ||
      (c.recurrence.type === 'weekly' && c.recurrence.daysOfWeek.includes(dayOfWeek)) ||
      (c.recurrence.type === 'none' && c.recurrence.specificDate === date) ||
      (c.recurrence.type === 'custom' && c.recurrence.daysOfWeek.includes(dayOfWeek));

    if (applies) {
      const start = timeToMinutes(c.startTime);
      const end   = timeToMinutes(c.endTime);
      fixedBlocks.push({
        commitmentId: c._id,
        title: c.title,
        type: 'commitment',
        startTime: c.startTime,
        endTime: c.endTime,
        durationMinutes: end - start,
        status: 'pending',
        color: c.color || '#8b5cf6',
        isFixed: true,
      });
    }
  }

  // Sort fixed blocks by start time
  fixedBlocks.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // --- 2. Find free windows ---
  const freeWindows = getFreeWindows(dayStart, dayEnd, fixedBlocks);

  // --- 3. Sort tasks by priority ---
  const sortedTasks = [...tasks]
    .filter(t => !['completed', 'deferred'].includes(t.status))
    .sort((a, b) => priorityScore(b) - priorityScore(a));

  // --- 4. Fit tasks into windows ---
  const scheduledBlocks = [];
  const unscheduledTasks = [];
  const unscheduledReasons = [];

  const taskColors = [
    '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
    '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
  ];
  let colorIdx = 0;

  // Working copy of free windows
  let windows = freeWindows.map(w => ({ ...w }));

  for (const task of sortedTasks) {
    const needed = task.estimatedDuration;
    let scheduled = false;

    for (let i = 0; i < windows.length; i++) {
      const win = windows[i];
      const available = win.end - win.start;

      if (available >= needed) {
        const startMin = win.start;
        const endMin   = startMin + needed;
        const color = taskColors[colorIdx % taskColors.length];
        colorIdx++;

        scheduledBlocks.push({
          taskId: task._id,
          title: task.title,
          type: 'task',
          startTime: minutesToTime(startMin),
          endTime:   minutesToTime(endMin),
          durationMinutes: needed,
          status: 'pending',
          color,
          isFixed: false,
        });

        // Consume this window slot + add break
        win.start = endMin + breakDur;
        if (win.start >= win.end) {
          windows.splice(i, 1);
        }

        scheduled = true;
        break;
      } else if (task.splittable && available >= (task.minSessionDuration || 25)) {
        // Schedule a partial session
        const partial = available - bufferDur;
        const color = taskColors[colorIdx % taskColors.length];
        colorIdx++;

        scheduledBlocks.push({
          taskId: task._id,
          title: `${task.title} (part)`,
          type: 'task',
          startTime: minutesToTime(win.start),
          endTime:   minutesToTime(win.start + partial),
          durationMinutes: partial,
          status: 'pending',
          color,
          isFixed: false,
        });

        windows.splice(i, 1);
        // Remaining task duration — push remainder as a separate unsatisfied need
        // For simplicity, mark as partially scheduled
        scheduled = true;
        break;
      }
    }

    if (!scheduled) {
      unscheduledTasks.push(task._id);
      unscheduledReasons.push({
        taskId: task._id,
        reason: `Not enough contiguous time for "${task.title}" (${needed} min needed).`,
      });
    }
  }

  // --- 5. Combine all blocks sorted by time ---
  const allBlocks = [...fixedBlocks, ...scheduledBlocks]
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // --- 6. Stats ---
  const totalScheduled = scheduledBlocks.reduce((s, b) => s + b.durationMinutes, 0);
  const totalAvailable = freeWindows.reduce((s, w) => s + (w.end - w.start), 0);
  const totalRequested = sortedTasks.reduce((s, t) => s + t.estimatedDuration, 0);
  const overloaded = totalRequested > totalAvailable;

  let note = '';
  if (overloaded) {
    note = `⚠️ This plan has ${Math.round(totalRequested / 60 * 10) / 10}h of work in a ${Math.round(totalAvailable / 60 * 10) / 10}h window. ${unscheduledTasks.length} task(s) could not be scheduled.`;
  }

  return {
    blocks: allBlocks,
    unscheduledTasks,
    unscheduledReasons,
    totalScheduled,
    totalAvailable,
    overloaded,
    note,
  };
}

/**
 * Returns free windows between dayStart and dayEnd, excluding fixedBlocks.
 */
function getFreeWindows(dayStart, dayEnd, fixedBlocks) {
  const windows = [];
  let cursor = dayStart;
  const MIN_WINDOW = 20; // minutes

  for (const block of fixedBlocks) {
    const bs = timeToMinutes(block.startTime);
    const be = timeToMinutes(block.endTime);

    if (bs > cursor && bs - cursor >= MIN_WINDOW) {
      windows.push({ start: cursor, end: bs });
    }
    cursor = Math.max(cursor, be);
  }

  if (dayEnd > cursor && dayEnd - cursor >= MIN_WINDOW) {
    windows.push({ start: cursor, end: dayEnd });
  }

  return windows;
}

module.exports = { generateSchedule, timeToMinutes, minutesToTime };
