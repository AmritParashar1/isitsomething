# Product Requirements Document (PRD)

# Adaptive AI Personal Planner

**Version:** 1.1
**Status:** Revised Draft
**Product Type:** AI-powered personal productivity and scheduling web application (mobile-first)

**Changes from v1.0:** Added builder context and a commitment loop (morning check-in and commit step); slip logging before every replan; block-start reminders moved into the MVP; deferral tracking; mobile-first and simpler editing for the MVP; long-term and weekly planning deprioritized until the daily loop works.

---

## 1. Product Overview

### 1.1 Context and Motivation

This product is first built for its author, a college student who struggles to commit to tasks and stay consistent. The intended daily experience is:

1. In the morning, the user tells the agent what they want to do today and shares their college schedule.
2. The agent proposes where each task fits.
3. The user commits to those time blocks.
4. Through the day, the user follows the plan and reports changes to the agent, which adapts the rest of the day.

The commitment itself belongs to the user. The product's job is to make the plan easy to create, easy to see at the right moment, and easy to adjust honestly, and to keep a truthful record of what actually happened so the user can learn their real limits.

### 1.2 Product Vision

Build an AI-powered personal planning application that helps users organize their daily activities and automatically generate optimized daily schedules based on user-defined tasks, availability, commitments, and preferences. Weekly and long-term goals are supported as secondary context once the daily loop is solid.

The application combines a conversational AI agent with an interactive scheduling system. Users decide what they want to accomplish, while the agent determines when those activities should take place.

The system continuously adapts to changing circumstances. When users miss a task, complete something early, add a new commitment, or change their availability, the agent can recalculate the remaining schedule, while keeping an honest record of the original plan.

**Core product principles:**

> The user owns the workload. The agent manages the timetable.

> Adapting the plan never erases the record of what was planned.

### 1.3 Problem Statement

Traditional to-do list applications help users record tasks but provide limited assistance in translating those tasks into realistic daily schedules.

Calendar applications allow users to allocate time manually, but maintaining a practical schedule becomes difficult when priorities, availability, and task durations change throughout the day.

AI assistants can generate schedules through conversation, but without persistent task data, structured scheduling logic, and interactive calendar integration, their plans can be difficult to maintain and update.

Users need a system that:

* Converts their selected tasks and commitments into a practical daily timetable.
* Gives them a clear moment to commit to the day's plan.
* Reminds them when a block begins.
* Automatically reorganizes the schedule when circumstances change.
* Supports natural-language interaction for making scheduling changes.
* Keeps the user in control of task selection, priorities, and schedule preferences.
* Records planned versus actual progress so users can see their real patterns and limits.

### 1.4 Product Goals

1. Reduce the time and effort required to plan a day.
2. Generate realistic daily schedules from user-selected tasks and fixed commitments.
3. Give the user a simple morning routine that ends in a committed plan.
4. Make rescheduling fast and intuitive through conversational interaction.
5. Preserve an honest history of planned versus actual work, including missed and deferred tasks.
6. Improve scheduling accuracy over time using actual task durations and user patterns.
7. Provide a unified interface for planning, executing, and reviewing work.

### 1.5 Non-Goals

The initial product will not:

* Independently decide which tasks a user must perform.
* Automatically create daily workloads without user input or approval.
* Replace a full project management platform.
* Require external calendar integrations to function.
* Automatically contact other people or make commitments on the user's behalf.
* Pressure, shame, or penalize the user. Accountability features (reminders, miss logs, deferral counts) are visible to the user, configurable, and meant to inform rather than punish.
* Guarantee an optimal schedule in every situation.

---

## 2. Target Users and Use Cases

### 2.1 Primary Target User

The initial user is the author: a student who wants structure for the day and a tool that makes planning and re-planning low effort. The product is designed to generalize to students, developers, professionals, and self-directed learners who manage multiple activities and need help organizing their time.

### 2.2 Primary Use Cases

| Use Case                 | Description                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| Morning check-in         | Tell the agent today's tasks and college schedule, review the proposed plan, and commit to it.  |
| Daily planning           | Enter today's tasks and commitments and receive an automatically generated schedule.            |
| Block-start reminders    | Be reminded when a scheduled block begins.                                                      |
| Schedule adaptation      | Recalculate the remaining schedule after a missed task, new commitment, or availability change. |
| Conversational editing   | Modify the schedule using natural-language instructions.                                        |
| Manual editing           | Adjust times, durations, and tasks directly, with simple controls.                              |
| Progress tracking        | Compare completed work with the original plan and review missed and deferred tasks.             |
| Weekly planning          | (Secondary) Define weekly goals and use them as context for daily planning.                     |
| Long-term planning       | (Later) Maintain broader goals and track progress over weeks or months.                         |
| Planning recommendations | Receive suggestions based on available time and, later, weekly targets.                         |

---

## 3. Core Product Philosophy

The product follows a user-directed, agent-assisted model.

**Task selection versus task scheduling**

The user decides what they want to work on. The agent assigns time slots to those tasks.

**Recommendations versus actions**

The agent can recommend additional tasks. These recommendations do not become scheduled work unless the user explicitly adds them.

**Automatic scheduling versus user control**

The agent can automatically generate and update schedules within the user's defined constraints. The user can manually edit the schedule or issue instructions to the agent at any time.

**Adaptation versus honest record**

Replanning is always available, but it never overwrites history. The original committed plan is kept as the baseline, and every miss, deferral, and replan is logged so the user can see what actually happened.

**Commitment belongs to the user**

The system supports commitment through a clear commit step, timely reminders, and honest records. It does not try to enforce behavior. The user decides how strict to be.

These principles apply consistently across daily, weekly, and long-term planning.

---

## 4. Product Scope and Planning Horizons

### 4.1 Daily Planning (Core)

**Purpose:** Convert the user's selected daily workload into a time-blocked schedule the user commits to.

Daily planning is the central feature of the initial product.

Users provide:

* Today's tasks and topics.
* Estimated durations.
* Priorities, deadlines, and other relevant task constraints.
* Fixed commitments, such as college, meetings, appointments, or exercise.
* Available time and preferred working hours.
* Optional preferences about breaks, task order, and energy levels.

The agent generates a timetable that:

* Fits tasks into available time.
* Respects fixed commitments.
* Accounts for task duration and priority.
* Includes reasonable breaks and transition buffers.
* Avoids unnecessary fragmentation of focused work.
* Identifies tasks that cannot fit into the available day.

The user reviews the proposed timetable, edits it if needed, and commits to it (see 4.2). The user can edit the schedule at any time.

### 4.2 Morning Check-In and Commit Flow

**Purpose:** Make "tell the planner what I want to do, then commit" the front door of the product.

Flow:

1. The app opens to a prompt such as "What do you want to get done today?"
2. The user enters tasks (typed or spoken text, one or many at once) and confirms or updates today's fixed commitments, such as the college timetable.
3. The agent proposes a schedule and flags anything that does not fit.
4. The user adjusts the proposal through chat or direct edits.
5. The user taps **Commit to this plan**. The schedule is saved as the day's committed baseline (version 1 of the committed plan) and shown in a "committed" state.

The commit step is lightweight. It exists to mark a clear moment of decision, not to lock the user in. After committing, the user can still replan (see 4.3), but the committed baseline is retained.

Optional: the user may mark one or two tasks as **must-do** so the end-of-day review can show whether the essentials were done even on a rough day.

### 4.3 Live Schedule Adaptation

**Purpose:** Keep the remaining schedule practical as the day changes, without erasing what happened.

Users can report:

* A task they could not complete or skipped.
* A task they completed earlier than expected.
* A new task or unexpected commitment.
* A change in availability.
* A preference to reduce or rearrange the remaining workload.

Before recalculating, the system records the event:

* For a missed or skipped block, the block is marked **missed**, and the agent offers (but does not require) a one-line reason.
* The original committed baseline is never modified. Replans create new revised versions linked to it.

The agent then recalculates the remaining schedule while preserving completed tasks and respecting fixed commitments.

When all requested tasks cannot fit, the agent should identify the conflict and present alternatives rather than silently overloading the day.

### 4.4 Weekly Planning (Secondary)

**Purpose:** Define the progress the user wants to make during a particular week.

Users can:

* Set weekly targets.
* Define measurable outcomes.
* Associate tasks with long-term goals.
* Set weekly availability and recurring commitments.
* Review completed, pending, and deferred work.

The agent can:

* Compare weekly targets with actual progress.
* Identify potential scheduling conflicts.
* Highlight goals that have received insufficient attention.
* Suggest possible tasks or changes to weekly targets.

Weekly goals provide context to the daily planner. They do not automatically generate daily tasks. This horizon is built after the daily loop is working (see Roadmap).

### 4.5 Long-Term Planning (Later)

**Purpose:** Maintain the user's broader objectives and provide context for weekly planning.

Users can:

* Create long-term goals.
* Set target dates.
* Add descriptions, milestones, and progress indicators.
* Link weekly goals to long-term objectives.
* Review progress across different goals.

Examples:

* Become proficient in data structures and algorithms.
* Learn backend system design.
* Complete a personal software project.
* Prepare for technical interviews.

The agent can analyze progress and suggest adjustments, but it must not autonomously create new commitments. This horizon is deliberately last, to keep the first versions focused on daily follow-through.

---

## 5. Functional Requirements

### FR-01: User Profile and Preferences

The system shall allow users to configure:

* Name and timezone.
* Preferred start and end of the day.
* Typical sleep and wake times.
* Preferred working hours.
* Break preferences.
* Default task duration and scheduling preferences.
* Recurring commitments (for example, the weekly college timetable).
* Reminder preferences (see FR-11).

Preferences should be editable and persistent.

### FR-02: Task Management

The system shall support creating, viewing, editing, deleting, and completing tasks.

Each task should support the following fields:

| Field                    | Description                                                                |
| ------------------------ | -------------------------------------------------------------------------- |
| Task ID                  | Unique identifier                                                          |
| Title                    | Task or topic name                                                         |
| Description              | Optional details                                                           |
| Estimated duration       | Expected time required                                                     |
| Priority                 | User-defined priority                                                      |
| Must-do                  | Optional flag for the day's essential tasks                                |
| Deadline                 | Optional completion deadline                                               |
| Goal association         | Optional linked weekly or long-term goal                                   |
| Splittable               | Whether the task can be divided across sessions                            |
| Minimum session duration | Smallest acceptable work block                                             |
| Status                   | Pending, scheduled, in progress, completed, missed, deferred               |
| Deferral count           | Number of times the task has been deferred or carried to another day       |
| Actual duration          | Time spent, when available                                                 |
| Notes                    | Additional task-specific context                                           |

Users should be able to create tasks individually or enter multiple tasks together in one message.

### FR-03: Daily Availability and Commitments

The system shall support:

* Fixed time blocks.
* Recurring commitments.
* Flexible availability windows.
* Break periods.
* Travel or transition buffers.

Fixed commitments must not be moved by the automatic scheduler unless the user explicitly changes them.

### FR-04: Automatic Daily Scheduling

The scheduling engine shall generate a time-blocked plan from the user's selected tasks and available time.

The engine must consider:

1. Fixed commitments.
2. Task durations.
3. User-defined priorities and must-do flags.
4. Deadlines.
5. Task dependencies.
6. Splittability and minimum session durations.
7. Preferred working hours.
8. Breaks and buffer periods.
9. Weekly goals as contextual information (when available).

The scheduler shall distinguish between hard constraints and soft preferences.

Hard constraints must be respected. Soft preferences should be optimized where practical.

When a feasible schedule cannot be generated, the system shall explain the scheduling conflicts and identify unscheduled tasks.

The user may deliberately overestimate what they can do. The scheduler should honor the requested workload rather than silently trimming it, and should surface overload clearly (for example, "this plan has 9 hours of work in a 7-hour window").

### FR-05: Commit Plan

The system shall provide a **Commit to this plan** action.

* Committing saves the current schedule as the day's baseline.
* The baseline is immutable. Later edits and replans create new versions that reference it.
* The UI shows a clear committed state for the day.
* Committing is optional; uncommitted days are still tracked but marked as such.

### FR-06: Weekly Goal Management

The system shall allow users to:

* Create weekly goals.
* Define measurable targets.
* Link tasks to goals.
* Track progress.
* Review goal completion at the end of the week.

The agent shall use weekly goals to provide context-aware recommendations without independently adding work to the user's daily schedule.

### FR-07: Long-Term Goal Management

The system shall allow users to:

* Create long-term goals.
* Define milestones.
* Set target dates.
* Associate weekly goals with long-term goals.
* Track progress over time.

The system shall provide a hierarchical relationship between long-term objectives, weekly targets, and daily tasks.

### FR-08: Conversational AI Agent

The application shall include a conversational interface for managing schedules.

The agent shall understand instructions such as:

* "Move my DBMS session to the evening."
* "I couldn't finish the first task. Replan the remaining day."
* "I missed the 3 PM block."
* "Add a one-hour React session after lunch."
* "I have a meeting at 4 PM. Update my schedule."
* "I finished DSA early. What can I do with the extra time?"
* "Based on my weekly goals, what am I falling behind on?"

The agent must operate on the actual stored schedule and task data.

It shall use structured tool calls to retrieve and modify scheduling data rather than relying on conversational memory alone.

The agent must distinguish between:

* A request to add a task.
* A request to schedule an existing task.
* A request to receive recommendations.
* A request to modify an existing schedule.
* A report that something was missed, skipped, or completed.

When the user reports a miss, the agent must log it (FR-10) before replanning.

### FR-09: Schedule Editing

The application shall provide an interactive daily timeline.

MVP editing controls:

* Tap a block to change its start time or duration.
* Reschedule or remove a task from the day.
* Mark tasks as completed, missed, or deferred.
* Restore the previous schedule version.

Later versions may add drag-and-drop moving and resizing.

Manual edits shall be reflected in the stored schedule and used as constraints during subsequent automatic replanning.

### FR-10: Dynamic Rescheduling and Slip Logging

When the user reports a change, the system shall:

1. Retrieve the latest schedule.
2. **Record the event first** (missed, skipped, completed early, added, or availability change), including an optional one-line reason.
3. Identify completed tasks and fixed commitments.
4. Update the affected task or availability data.
5. Identify the remaining free time.
6. Run the scheduling engine again.
7. Preserve unaffected schedule blocks wherever practical.
8. Save the result as a new revised version linked to the committed baseline.
9. Update the daily timeline.
10. Report any unscheduled tasks or conflicts.

The rescheduling engine should minimize unnecessary changes to existing time blocks.

Replanning must never delete or overwrite the committed baseline or the miss log.

### FR-11: Reminders and Notifications

Block-start reminders are part of the MVP.

The system shall:

* Send a reminder when a scheduled block is about to start (for example, "DBMS starts now. Start?").
* Allow the user to respond with start, snooze, or mark as missed.
* Let the user configure lead time, quiet hours, and which blocks trigger reminders.
* Offer an optional morning prompt to begin the check-in.

Delivery options, in order of build simplicity: browser or PWA push notifications; a daily email summary or an external phone alarm as a stopgap.

### FR-12: Progress Tracking and Daily Review

The system shall track:

* Planned tasks (from the committed baseline).
* Completed tasks.
* Missed or deferred tasks, with optional reasons.
* Estimated versus actual duration.
* Planned versus actual start and end times.
* Deferral counts per task.
* Daily and weekly goal progress (when goals are enabled).

At the end of the day, the system should provide an optional, lightweight summary of:

* What was planned versus what was done.
* Whether must-do tasks were completed.
* What was missed and any reasons given.
* Tasks that have been deferred repeatedly.

Over time, the system should surface simple patterns, such as which times of day or task types are missed most often and where estimates are consistently off, so the user can adjust their limits.

Unfinished tasks shall not automatically be added to the next day's schedule without user direction. They remain visible in the review and the task list, with their deferral count.

---

## 6. User Experience and Interface

### 6.0 Design Approach

The interface is mobile-first, because the morning check-in and block reminders will mostly happen on a phone. Desktop gets the same flows with more room for the timeline and chat side by side.

### 6.1 Morning Check-In Screen

The default screen on first open each day. It contains:

* A prompt for today's tasks.
* A summary of today's fixed commitments (editable).
* The proposed schedule.
* A chat input to refine the plan.
* The **Commit to this plan** button.

### 6.2 Main Dashboard

The dashboard provides a unified overview of the user's planning activity.

**Primary sections:**

* Today's schedule and committed status.
* Today's task list.
* Current progress.
* Next block and upcoming commitments.
* Quick access to the AI chat interface.
* Weekly goal progress (once weekly planning is enabled).

### 6.3 Daily Timeline

The daily timeline is the primary workspace.

It should:

* Display the entire day chronologically.
* Visually distinguish fixed commitments from flexible tasks.
* Show unscheduled tasks.
* Support tap-to-edit in the MVP (drag-and-drop later).
* Highlight scheduling conflicts.
* Indicate completed, missed, and deferred tasks.
* Provide a quick way to request rescheduling.
* Allow viewing the committed baseline next to the current version.

### 6.4 AI Chat Interface

The chat interface should be available alongside the daily timeline or in a dedicated panel.

The user should be able to:

* Discuss the current schedule.
* Request changes.
* Ask for recommendations.
* Report progress, including missed blocks.
* Review why the agent placed a task in a particular time slot.

Changes made through chat must immediately update the underlying schedule when successfully applied.

### 6.5 Review View

A simple view showing planned versus actual for a day and, over time, for recent weeks: completion rate, missed blocks, deferral counts, and estimate accuracy.

### 6.6 Weekly View (Secondary)

The weekly interface should display:

* Weekly goals and targets.
* Daily schedules.
* Goal-related task distribution.
* Progress indicators.
* Available planning capacity.
* Unscheduled or deferred tasks.

### 6.7 Long-Term Goals View (Later)

The long-term planning interface should display:

* Active goals.
* Milestones.
* Target dates.
* Weekly progress.
* Historical progress.
* Relevant recommendations.

---

## 7. AI Agent and Scheduling Architecture

### 7.1 Architectural Principle

The system shall separate natural-language understanding from scheduling and data management.

The LLM interprets user instructions and coordinates tools. A deterministic scheduling engine handles time allocation and constraint enforcement.

The LLM should not be responsible for calculating or inventing final time slots without validation.

### 7.2 Core Components

**Frontend**

* React.js (mobile-first, installable as a PWA for notifications)
* Interactive timeline components
* Task management interface
* Conversational chat panel

**Backend**

* Node.js
* Express.js
* Authentication and authorization
* REST APIs
* Agent orchestration
* Schedule version management
* Reminder scheduling and push delivery

**Database**

* MongoDB
* Users and preferences
* Tasks and goals
* Fixed commitments and availability
* Daily schedules (baseline and revisions)
* Schedule change history and miss log
* Conversation records where necessary

**AI Layer**

* Tool-calling LLM
* Intent recognition
* Context retrieval
* Natural-language task extraction
* Schedule modification requests
* Recommendations and explanations

**Scheduling Engine**

* Custom constraint-based scheduling logic for the MVP
* Optional optimization solver, such as Google OR-Tools, in later versions
* Conflict detection
* Time-slot allocation
* Dynamic replanning

### 7.3 Agent Tools

The agent should have access to narrowly scoped tools.

| Tool                      | Purpose                                                          |
| ------------------------- | ---------------------------------------------------------------- |
| `get_user_preferences`    | Retrieve planning preferences                                    |
| `get_today_tasks`         | Retrieve selected daily tasks                                    |
| `get_weekly_goals`        | Retrieve weekly planning context (when enabled)                  |
| `get_long_term_goals`     | Retrieve broader goal context (when enabled)                     |
| `get_daily_availability`  | Retrieve available time and fixed commitments                    |
| `generate_daily_schedule` | Invoke the scheduling engine                                     |
| `commit_schedule`         | Save the current schedule as the day's baseline (user-confirmed) |
| `get_current_schedule`    | Retrieve the latest daily schedule                               |
| `update_task`             | Modify task details or status                                    |
| `add_task`                | Add a user-requested task                                        |
| `log_schedule_event`      | Record a miss, skip, early completion, or reason before replanning |
| `update_availability`     | Modify commitments or availability                               |
| `reschedule_day`          | Recalculate the remaining schedule (requires a logged event)     |
| `get_schedule_conflicts`  | Identify infeasible scheduling constraints                       |
| `get_progress_summary`    | Retrieve actual versus planned progress and patterns             |

The agent should have clear permissions for each tool.

For example, it may schedule user-selected tasks automatically, but it must not create new daily work solely because a weekly goal is behind schedule, and it must not commit a schedule without explicit user confirmation.

### 7.4 Scheduling Algorithm

The initial scheduling engine should use a transparent heuristic.

Suggested scheduling process:

1. Load tasks, availability, preferences, and fixed commitments.
2. Identify hard constraints and soft preferences.
3. Divide available time into usable scheduling windows.
4. Rank tasks using must-do flags, user priorities, deadlines, and relevant constraints.
5. Allocate suitable time slots based on task duration and scheduling preferences.
6. Add breaks and transition buffers.
7. Detect overlaps and infeasible assignments.
8. Return a structured schedule and a list of unscheduled tasks.

The scheduling algorithm should prioritize producing a feasible and understandable timetable over claiming mathematical optimality.

Future versions may introduce:

* Constraint programming.
* More sophisticated task-order optimization.
* Energy-aware scheduling.
* Historical duration estimation using actual durations.
* Multi-day workload balancing.

### 7.5 Schedule State and Versioning

Every generated schedule should have a version identifier and timestamp.

The system should preserve:

* The original generated proposal.
* The **committed baseline** for the day (immutable).
* User-edited versions.
* Automatically revised versions.
* Change reasons and logged events (misses, skips, reasons).
* Affected tasks and time blocks.

For the MVP, storing a full snapshot on each change is sufficient. This supports undo, comparison with the baseline, miss analysis, and debugging.

---

## 8. Data Model

The initial database should include the following logical collections.

### Users

* User ID
* Profile
* Timezone
* Preferences (including reminder settings)
* Default availability

### Tasks

* Task ID
* User ID
* Title
* Description
* Estimated duration
* Actual duration
* Priority
* Must-do flag
* Deadline
* Status
* Deferral count
* Goal associations
* Scheduling constraints

### Commitments

* Commitment ID
* User ID
* Title
* Start time
* End time
* Recurrence rules
* Fixed or flexible status

### Daily Schedules

* Schedule ID
* User ID
* Date
* Version
* Type (proposal, committed baseline, revision)
* Baseline schedule ID (for revisions)
* Status
* Scheduled blocks
* Unscheduled tasks
* Generation metadata

### Schedule Events

* Event ID
* Schedule ID
* Task ID or commitment ID
* Start time
* End time
* Completion status (pending, completed, missed, skipped, deferred)
* Actual start and end times

### Schedule Change Log

* Log ID
* User ID
* Date
* Event type (miss, skip, early completion, added task, availability change, manual edit)
* Task or block reference
* Optional user-provided reason
* Resulting schedule version
* Timestamp

### Reminders

* Reminder ID
* User ID
* Schedule event reference
* Scheduled send time
* Status and user response (started, snoozed, missed)

### Goals (Secondary)

* Goal ID
* User ID
* Title
* Description
* Goal type
* Target date
* Milestones
* Progress

### Weekly Plans (Secondary)

* Plan ID
* User ID
* Week start date
* Weekly targets
* Goal associations
* Review status

### Conversations

* Conversation ID
* User ID
* Messages
* Tool-call records
* Relevant schedule references

The data model should allow tasks to exist independently of a specific daily schedule. This is necessary for recurring tasks, weekly planning, deferral tracking, and future rescheduling features.

---

## 9. Non-Functional Requirements

### Performance

* Initial schedule generation should generally complete within a few seconds for ordinary daily workloads.
* Routine task updates should feel responsive.
* Chat interactions should provide clear feedback while the agent is processing requests.

### Reliability

* Scheduling operations should be validated before being persisted.
* Failed scheduling operations should not corrupt the existing schedule.
* Schedule updates should be atomic where practical.
* Conflicting edits should be detected.
* Reminders should be delivered on time and should not duplicate after a replan.

### Security

* Authenticate users.
* Isolate each user's data.
* Validate all agent tool inputs.
* Apply authorization checks to every scheduling operation.
* Protect API credentials and sensitive user data.
* Provide a way to delete account data.

### Explainability

* The agent should be able to explain scheduling decisions.
* Conflicts and unscheduled tasks must be visible.
* Users should be able to inspect what changed after a replanning operation, including the difference from the committed baseline.

### Usability

* Daily planning should require minimal interaction.
* The task entry workflow should support quick input.
* Users should be able to edit schedules without using chat.
* The morning check-in must work well on a phone.
* The application should be usable on desktop and mobile screens.

---

## 10. MVP Definition

The MVP should focus on solving one problem well: helping the user plan a day in the morning, commit to it, get reminded, and adapt it honestly as the day changes.

### MVP Features

**Must Have**

* User profile and basic preferences.
* Task creation and editing, including quick multi-task entry.
* Daily availability and fixed commitments (including the recurring college timetable).
* Morning check-in flow ending in **Commit to this plan**.
* Automatic daily schedule generation.
* Mobile-first daily timeline with tap-to-edit.
* Conversational schedule modification.
* Slip logging (missed and skipped blocks, optional reasons) before every replan.
* Dynamic rescheduling that preserves the committed baseline.
* Block-start reminders.
* Conflict detection.
* Basic progress tracking (planned versus actual, deferral counts).
* Lightweight end-of-day review.

**Should Have**

* Must-do flag and "must-dos done" view.
* Planned versus actual duration tracking feeding back into estimates.
* Pattern summaries (most-missed times and tasks, estimate accuracy).
* Schedule history and undo.
* Basic weekly goal tracking.
* Context-aware task recommendations.

**Future Enhancements**

* Long-term goals and milestones.
* Weekly planning view and weekly review reports.
* Drag-and-drop timeline editing.
* Calendar integrations.
* Proactive notifications beyond block reminders.
* Advanced optimization algorithms.
* Automatic duration estimation.
* Energy-aware scheduling.
* Recurring task automation.
* More sophisticated long-term workload planning.

### MVP Success Criteria

The MVP will be considered successful when a user can:

1. Define their availability and fixed commitments.
2. Tell the agent the day's tasks in the morning.
3. Receive a complete daily schedule and commit to it.
4. Manually edit the generated schedule.
5. Modify the schedule using natural language.
6. Receive a reminder when a block starts.
7. Report a missed task, have it logged, and receive an updated timetable.
8. See how the day went compared with the committed plan.
9. After a couple of weeks, see where they miss most and where their estimates are off.

---

## 11. Development Roadmap

### Phase 1: Core Planner

**Objective:** Establish the task, availability, and schedule data model.

Deliverables:

* Mobile-first React app.
* Task management.
* User preferences.
* Fixed commitments and availability.
* Daily timeline with tap-to-edit.
* Manual scheduling.

### Phase 2: Scheduling Engine

**Objective:** Automate time allocation.

Deliverables:

* Constraint representation.
* Task prioritization.
* Time-slot allocation.
* Break and buffer handling.
* Conflict detection.
* Schedule generation and validation.

### Phase 3: Conversational Agent and Commit Flow

**Objective:** Make the morning check-in and schedule management accessible through natural language.

Deliverables:

* LLM integration.
* Tool-calling workflow.
* Morning check-in screen and commit step.
* Structured schedule modifications.
* User intent handling.
* Schedule explanations.
* Persistent schedule updates.

### Phase 4: Adaptive Scheduling, Logging, and Reminders

**Objective:** Handle real-world changes honestly and keep the user on track through the day.

Deliverables:

* Missed-task handling with slip logging.
* Dynamic replanning that preserves the baseline.
* Preservation of completed and unaffected blocks.
* Schedule versioning.
* Block-start reminders.
* Actual duration tracking.
* End-of-day review and deferral counts.
* Workload conflict resolution.

### Phase 5: Insights and Weekly Planning

**Objective:** Use the recorded history to help the user understand their limits, then connect daily work to broader goals.

Deliverables:

* Pattern summaries and estimate feedback.
* Basic weekly goals and review.
* Context-aware recommendations.

### Phase 6: Long-Term Planning

**Objective:** Connect weekly work to broader objectives.

Deliverables:

* Long-term goals and milestones.
* Goal progress tracking.
* Planning horizon integration.

---

## 12. Risks and Mitigations

| Risk                       | Potential Impact                                       | Mitigation                                                                           |
| -------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Unrealistic scheduling     | Users lose trust in generated plans                    | Include buffers, enforce availability, expose overload and unscheduled tasks         |
| Replanning as escape hatch | Misses vanish and limits stay invisible                | Log every miss before replanning; keep the committed baseline; show planned vs. done |
| Excessive rescheduling     | Constantly changing timetables become frustrating      | Minimize changes to unaffected blocks                                                |
| Missed plan, no prompt     | User forgets the plan exists                           | Block-start reminders and a morning prompt in the MVP                                |
| LLM tool errors            | Incorrect task or schedule modifications               | Validate all tool inputs and outputs; require user confirmation to commit            |
| Overcomplicated MVP        | Slow development and delayed feedback                  | Build the daily loop first; defer goal hierarchy                                     |
| Unwanted task creation     | Agent violates user control                            | Separate recommendations from task creation                                          |
| Poor duration estimates    | Schedules become infeasible                            | Allow manual estimates; track actuals early and surface estimate drift               |
| Lost schedule context      | Replanning produces inconsistent results               | Maintain persistent structured schedule state                                        |
| Tracking feels punishing   | User stops opening the app                             | Keep logs informational, optional reasons, configurable strictness, no shaming copy  |
| Goal overload              | Weekly goals create unrealistic daily workloads        | Treat goals as context, surface capacity gaps, require user decisions                |

---

## 13. Product Metrics

The initial product should focus on practical usefulness rather than measuring productivity for its own sake.

Suggested metrics:

**Planning efficiency**

* Time required to complete the morning check-in and commit.
* Number of manual adjustments after generation.
* Percentage of selected tasks successfully assigned a time slot.

**Schedule reliability**

* Percentage of committed blocks completed.
* Percentage of must-do tasks completed.
* Difference between estimated and actual task durations.
* Number of scheduling conflicts.
* Frequency of major schedule changes.

**Adaptive planning**

* Time required to produce an updated schedule.
* Percentage of replanning operations that preserve unaffected blocks.
* Number of tasks successfully rescheduled after unexpected changes.
* Number of tasks deferred repeatedly.

**User experience**

* Days with a completed morning check-in.
* Reminder response rate (started, snoozed, missed).
* Frequency of manual versus conversational edits.
* User satisfaction with generated schedules.
* Percentage of days for which users find the plan usable.

Metrics should be interpreted in context. A lower task completion rate is not automatically a sign of failure if users are deliberately reducing workloads or adapting to unexpected circumstances. In the early weeks, the main purpose of these metrics is to reveal the user's real limits, not to judge them.

---

## 14. Open Product Decisions

The following questions should be resolved through actual use of the MVP rather than treated as mandatory upfront decisions.

1. **Schedule generation:** Should the system generate the entire day at once or allow users to schedule only the remaining hours?
2. **Task duration:** Should users always provide durations, or should the agent suggest estimates for unspecified tasks?
3. **Automatic replanning:** Should changes trigger immediate rescheduling, or should the agent sometimes ask before making significant changes?
4. **Reminder behavior:** How many reminders per block, and how persistent should they be?
5. **Miss reasons:** Should the agent always ask for a reason, or only after repeated misses?
6. **Weekly planning:** Should users define weekly targets in a dedicated planning session or update them continuously?
7. **Scheduling preferences:** How much control should users have over task order, preferred time windows, and energy-based scheduling?
8. **Schedule persistence:** Should schedules be treated as daily snapshots, or should the system maintain a continuous evolving schedule with historical versions?
9. **Strictness:** Should the user be able to choose how firm the commit step feels (for example, a confirmation prompt before replanning)?

These decisions can be informed by observing actual planning behavior during the first few weeks of use.

---

## 15. Final Product Definition

The Adaptive AI Personal Planner is a user-directed, AI-assisted planning system built around one daily loop: plan in the morning, commit, get reminded, adapt honestly, and review. It connects to weekly targets and long-term objectives once that loop is working.

The user determines the workload and defines their commitments. The application converts the selected tasks into a time-blocked schedule, helps the user commit to it, and adapts the schedule when reality changes, while keeping a truthful record of what was planned and what happened.

The product's defining capability is not simply generating a timetable. It is maintaining a practical, editable schedule throughout the day, preserving the user's control over what they choose to accomplish, and giving them an honest picture of their own patterns.

**The central product promise:**

*Tell the planner what you want to get done, give it your commitments, and commit to the plan it proposes. When your day changes, tell it what happened and let it adjust, and the planner will keep the record straight so you can see what you can really do.*
