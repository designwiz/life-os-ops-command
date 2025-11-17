"use client";

import React, { useEffect, useState } from "react";

type Status = "Inbox" | "Today" | "This Week" | "Later" | "Waiting" | "Done";

type Task = {
  id: string;
  title: string;
  notes: string;
  status: Status;
  createdAt: string;
};

const STATUSES: Status[] = [
  "Inbox",
  "Today",
  "This Week",
  "Later",
  "Waiting",
  "Done",
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("Inbox");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load tasks for the current profile
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Determine profile
      let currentProfileId: string | null = null;
      const savedProfile = window.localStorage.getItem(
        "lifeOS_currentProfile"
      );
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile) as { id?: string };
        if (parsed.id) currentProfileId = parsed.id;
      }
      setProfileId(currentProfileId);

      const key =
        currentProfileId !== null
          ? `lifeOS_tasks_${currentProfileId}`
          : "lifeOS_tasks";

      const savedTasks = window.localStorage.getItem(key);
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks) as Task[];
        parsed.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
        setTasks(parsed);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  // Save whenever tasks change
  useEffect(() => {
    if (!profileLoaded) return;
    if (typeof window === "undefined") return;

    try {
      const key =
        profileId !== null
          ? `lifeOS_tasks_${profileId}`
          : "lifeOS_tasks";
      window.localStorage.setItem(key, JSON.stringify(tasks));
    } catch (err) {
      console.error("Failed to save tasks", err);
    }
  }, [tasks, profileId, profileLoaded]);

  const addTask = () => {
    if (!title.trim()) {
      alert("Task title is required.");
      return;
    }
    const now = new Date().toISOString();
    const newTask: Task = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: title.trim(),
      notes: notes.trim(),
      status,
      createdAt: now,
    };
    setTasks((prev) => [...prev, newTask]);
    setTitle("");
    setNotes("");
    setStatus("Inbox");
  };

  const updateTaskStatus = (id: string, status: Status) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  };

  const deleteTask = (id: string) => {
    if (!confirm("Delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const filtered =
    statusFilter === "All"
      ? tasks
      : tasks.filter((t) => t.status === statusFilter);

  const tasksByStatus: Record<Status, Task[]> = {
    Inbox: [],
    Today: [],
    "This Week": [],
    Later: [],
    Waiting: [],
    Done: [],
  };

  for (const t of filtered) {
    tasksByStatus[t.status].push(t);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Tasks</h1>
          <p className="text-sm text-zinc-400">
            Capture everything – then decide when to deal with it.
          </p>
        </div>
        <a
          href="/"
          className="text-xs px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition"
        >
          ⬅ Back to dashboard
        </a>
      </header>

      {/* New task form */}
      <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">
          Add task
        </h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2 space-y-1">
            <label className="block text-zinc-400">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
              placeholder="e.g. Renew car tax, book NCT..."
            />
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">Notes (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
              placeholder="e.g. find policy number..."
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={addTask}
            className="text-xs px-3 py-2 rounded-full border border-purple-500 bg-purple-900/40 hover:bg-purple-800/60 text-purple-100 transition"
          >
            + Add task
          </button>
        </div>
      </section>

      {/* Filters */}
      <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-300">
            Filters
          </h2>
          <p className="text-[11px] text-zinc-500">
            Showing{" "}
            <span className="text-zinc-100 font-semibold">
              {filtered.length}
            </span>{" "}
            task{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("All")}
            className={
              "px-3 py-1 rounded-full border text-[11px] " +
              (statusFilter === "All"
                ? "border-sky-500 text-sky-300 bg-sky-900/40"
                : "border-zinc-700 text-zinc-300 bg-zinc-900")
            }
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={
                "px-3 py-1 rounded-full border text-[11px] " +
                (statusFilter === s
                  ? "border-sky-500 text-sky-300 bg-sky-900/40"
                  : "border-zinc-700 text-zinc-300 bg-zinc-900")
              }
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Board */}
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6 text-xs">
        {STATUSES.map((s) => (
          <div
            key={s}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-zinc-200 text-xs">{s}</h2>
              <span className="text-zinc-500 text-[11px]">
                {tasksByStatus[s].length}
              </span>
            </div>
            <div className="space-y-2">
              {tasksByStatus[s].map((task) => (
                <article
                  key={task.id}
                  className="rounded-xl border border-zinc-700 bg-zinc-800/80 p-2 space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-zinc-100 text-xs font-semibold">
                        {task.title}
                      </p>
                      {task.notes && (
                        <p className="text-[11px] text-zinc-400">
                          {task.notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-[10px] text-zinc-500 hover:text-red-400"
                      title="Delete task"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        updateTaskStatus(
                          task.id,
                          e.target.value as Status
                        )
                      }
                      className="rounded bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-100"
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </article>
              ))}
              {tasksByStatus[s].length === 0 && (
                <p className="text-[11px] text-zinc-500">
                  No tasks in this lane.
                </p>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
