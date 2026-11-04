"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CourseSummary } from "@/lib/data";

export type StudyTask = {
  id: string;
  title: string;
  details: string;
  subject: string;
  task_date: string;
  start_time: string | null;
  is_completed: boolean;
};

type PlannerView = "day" | "week" | "month" | "year";

function addDays(date: string, count: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + count);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function dateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDay(date: string) {
  return new Intl.DateTimeFormat("en", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00`));
}

export default function StudyPlanner({
  userId,
  today,
  initialTasks,
  courses,
}: {
  userId: string;
  today: string;
  initialTasks: StudyTask[];
  courses: CourseSummary[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedDate, setSelectedDate] = useState(today);
  const [view, setView] = useState<PlannerView>("week");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [startTime, setStartTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingTask, setSavingTask] = useState("");
  const [message, setMessage] = useState("");

  const week = Array.from({ length: 7 }, (_, index) => addDays(selectedDate, index));
  const selectedDateValue = new Date(`${selectedDate}T12:00:00`);
  const monthStart = new Date(selectedDateValue.getFullYear(), selectedDateValue.getMonth(), 1);
  const monthGridStart = new Date(monthStart);
  monthGridStart.setDate(monthStart.getDate() - monthStart.getDay());
  const monthGrid = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(monthGridStart);
    date.setDate(monthGridStart.getDate() + index);
    return dateString(date);
  });
  const yearMonths = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(selectedDateValue.getFullYear(), index, 1);
    const monthKey = dateString(date).slice(0, 7);
    const monthTasks = tasks.filter((task) => task.task_date.startsWith(monthKey));
    return { date, monthKey, tasks: monthTasks.length, completed: monthTasks.filter((task) => task.is_completed).length };
  });
  const dailyTasks = useMemo(
    () => tasks.filter((task) => task.task_date === selectedDate).sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? "")),
    [selectedDate, tasks],
  );
  const doneCount = dailyTasks.filter((task) => task.is_completed).length;
  const remainingMinutes = dailyTasks.filter((task) => !task.is_completed).length * 45;
  const dateLabel = view === "day"
    ? formatDay(selectedDate)
    : view === "year"
    ? String(selectedDateValue.getFullYear())
    : new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(selectedDateValue);

  function moveDate(direction: number) {
    const date = new Date(`${selectedDate}T12:00:00`);
    if (view === "day") date.setDate(date.getDate() + direction);
    if (view === "week") date.setDate(date.getDate() + direction * 7);
    if (view === "month" || view === "year") {
      const day = date.getDate();
      date.setDate(1);
      if (view === "month") date.setMonth(date.getMonth() + direction);
      else date.setFullYear(date.getFullYear() + direction);
      date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
    }
    setSelectedDate(dateString(date));
  }

  async function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setMessage("Add a task title before saving.");
      return;
    }
    setSaving(true);
    setMessage("");
    const payload = {
      user_id: userId,
      title: cleanTitle,
      subject: subject.trim(),
      details: details.trim(),
      task_date: selectedDate,
      start_time: startTime || null,
    };
    const { data, error } = await supabase.from("study_tasks").insert(payload)
      .select("id, title, details, subject, task_date, start_time, is_completed").single();
    if (error) {
      setMessage(`Could not add task: ${error.message}`);
    } else {
      setTasks((current) => [...current, data]);
      setTitle("");
      setDetails("");
      setStartTime("");
    }
    setSaving(false);
  }

  async function toggleTask(task: StudyTask) {
    setSavingTask(task.id);
    setMessage("");
    const { error } = await supabase.from("study_tasks")
      .update({ is_completed: !task.is_completed, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("id", task.id);
    if (error) {
      setMessage(`Could not update task: ${error.message}`);
    } else {
      setTasks((current) => current.map((item) => item.id === task.id ? { ...item, is_completed: !task.is_completed } : item));
    }
    setSavingTask("");
  }

  async function deleteTask(taskId: string) {
    setSavingTask(taskId);
    setMessage("");
    const { error } = await supabase.from("study_tasks").delete().eq("user_id", userId).eq("id", taskId);
    if (error) {
      setMessage(`Could not remove task: ${error.message}`);
    } else {
      setTasks((current) => current.filter((task) => task.id !== taskId));
    }
    setSavingTask("");
  }

  return (
    <div className="planner-layout">
      <section className="planner-main">
        <div className="planner-view-toolbar">
          <div className="planner-view-switch" aria-label="Planner view">
            {(["day", "week", "month", "year"] as PlannerView[]).map((item) => <button key={item} type="button" className={view === item ? "active" : ""} aria-pressed={view === item} onClick={() => setView(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}
          </div>
          <div className="planner-date-navigation"><button type="button" aria-label="Previous period" onClick={() => moveDate(-1)}>←</button><strong>{dateLabel}</strong><button type="button" aria-label="Next period" onClick={() => moveDate(1)}>→</button></div>
          <label className="planner-date-picker"><span>Jump to date</span><input type="date" value={selectedDate} onChange={(event) => event.target.value && setSelectedDate(event.target.value)} /></label>
        </div>

        {view === "week" && <div className="planner-week" aria-label="Choose a day">
          {week.map((date) => {
            const count = tasks.filter((task) => task.task_date === date).length;
            return <button type="button" className={`planner-day ${selectedDate === date ? "selected" : ""}`} key={date} onClick={() => { setSelectedDate(date); setMessage(""); }}>
              <span>{formatDay(date)}</span><strong>{count}</strong><small>{count === 1 ? "task" : "tasks"}</small>
            </button>;
          })}
        </div>}
        {view === "month" && <div className="planner-month-calendar" aria-label="Choose a day in the month">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span className="planner-month-weekday" key={`${day}-${index}`}>{day}</span>)}
          {monthGrid.map((date) => {
            const count = tasks.filter((task) => task.task_date === date).length;
            const inMonth = date.slice(0, 7) === selectedDate.slice(0, 7);
            return <button key={date} type="button" className={`planner-month-day ${inMonth ? "" : "outside-month"} ${selectedDate === date ? "selected" : ""}`} onClick={() => { setSelectedDate(date); setMessage(""); }}><strong>{Number(date.slice(-2))}</strong>{count > 0 && <small>{count}</small>}</button>;
          })}
        </div>}
        {view === "year" && <div className="planner-year-grid" aria-label="Choose a month">
          {yearMonths.map((month) => {
            const key = dateString(month.date);
            return <button key={key} type="button" className={`planner-year-month ${selectedDate.slice(0, 7) === month.monthKey ? "selected" : ""}`} onClick={() => { setSelectedDate(key); setView("month"); }}><strong>{new Intl.DateTimeFormat("en", { month: "long" }).format(month.date)}</strong><span>{month.tasks} {month.tasks === 1 ? "task" : "tasks"}</span><small>{month.completed} done</small></button>;
          })}
        </div>}

        <div className="planner-summary">
          <div><span className="card-kicker">DAILY PLAN</span><h2>{selectedDate === today ? "Today" : formatDay(selectedDate)}</h2></div>
          <div className="planner-summary-stats"><span><strong>{dailyTasks.length}</strong> tasks</span><span><strong>{doneCount}</strong> done</span><span><strong>{remainingMinutes}</strong> min left</span></div>
        </div>

        <div className="planner-task-list">
          {dailyTasks.length === 0 ? <div className="planner-empty"><span>✳</span><strong>Your day is open</strong><p>Add a study session below or continue one of your courses.</p></div> : dailyTasks.map((task) => (
            <article className={`planner-task ${task.is_completed ? "planner-task-done" : ""}`} key={task.id}>
              <button type="button" aria-label={task.is_completed ? `Reopen ${task.title}` : `Complete ${task.title}`} className={`planner-task-check ${task.is_completed ? "checked" : ""}`} disabled={savingTask === task.id} onClick={() => toggleTask(task)}>{task.is_completed ? "✓" : ""}</button>
              <div className="planner-task-copy"><div className="planner-task-meta">{task.start_time && <span>{task.start_time.slice(0, 5)}</span>}{task.subject && <span>{task.subject}</span>}</div><h3>{task.title}</h3>{task.details && <p>{task.details}</p>}</div>
              <button type="button" className="planner-task-delete" aria-label={`Delete ${task.title}`} disabled={savingTask === task.id} onClick={() => deleteTask(task.id)}>×</button>
            </article>
          ))}
        </div>

        <form className="planner-add-form" onSubmit={addTask}>
          <div className="planner-add-heading"><span className="card-kicker">PLAN A STUDY SESSION</span><strong>Add a task for {formatDay(selectedDate)}</strong></div>
          <div className="planner-form-grid">
            <label>Task<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Revise chemical bonding" maxLength={160} required /></label>
            <label>Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Chemistry" maxLength={80} /></label>
            <label>Start time<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
            <label>Notes<input value={details} onChange={(event) => setDetails(event.target.value)} placeholder="What do you want to cover?" maxLength={500} /></label>
          </div>
          <div className="planner-add-footer"><span>45 min estimated per task · Edit or remove anytime</span><button type="submit" disabled={saving}>{saving ? "Saving..." : <>Add to my plan <span aria-hidden="true">+</span></>}</button></div>
          {message && <p className="inline-feedback" role="status">{message}</p>}
        </form>
      </section>

      <aside className="planner-sidebar">
        <div className="planner-focus-card"><span className="card-kicker">A GENTLE REMINDER</span><span className="planner-focus-icon">✦</span><h3>One session at a time.</h3><p>Your plan is yours. A small, realistic session is better than a perfect plan you cannot follow.</p><div className="planner-focus-foot">YOUR STUDY SPACE · PRIVATE BY DEFAULT</div></div>
        <div className="planner-courses-card"><div className="panel-heading"><div><span className="card-kicker">KEEP YOUR MOMENTUM</span><h2>Continue a course</h2></div></div>
          {courses.length === 0 ? <p className="planner-no-courses">Add a YouTube playlist to your dashboard to see it here.</p> : courses.slice(0, 4).map((course) => (
            <Link href={course.continueVideoId ? `/watch/${course.id}/${course.continueVideoId}` : `/courses/${course.id}`} className="planner-course-link" key={course.id}>
              <span className="planner-course-mark">▶</span><span><strong>{course.title}</strong><small>{course.completedVideos} of {course.totalVideos} lessons complete</small></span><b aria-hidden="true">→</b>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
