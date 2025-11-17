"use client";

import React, { useEffect, useState } from "react";

type Status = "Inbox" | "Today" | "This Week" | "Later" | "Waiting" | "Done";
type Priority = "Low" | "Normal" | "High";

type Task = {
  id: string;
  title: string;
  notes: string;
  status: Status;
  assignedTo: "" | "Will" | "Michelle";
  priority: Priority;
  dueDate: string; // YYYY-MM-DD or ""
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

const PRIORITIES: Priority[] = ["Low", "Normal", "High"];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  // New task form state
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("Inbox");
  const [assignedTo, setAssignedTo] = useState<"" | "Will" | "Michelle">("");
  const [priority, setPriority] = useState<Priority>("Normal");
  const [dueDate, setDueDate] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [assignmentFilter, setAssignmentFilter] = useState<
    "All" | "Will" | "Michelle" | "Unassigned"
  >("All");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">("All");
  const [search, setSearch] = useState("");

  const todayStr = new Date().toISOString().slice(0, 10);

  // Load shared tasks from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = window.localStorage.getItem("lifeOS_tasks");
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Task>[];

        const normalised: Task[] = parsed.map((t) => ({
          id:
            t.id ||
            `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          title: t.title || "",
          notes: t.notes || "",
          status: (t.status as Status) || "Inbox",
          assignedTo: (t.assignedTo as "" | "Will" | "Michelle") || "",
          priority: (t.priority as Priority) || "Normal",
          dueDate: t.dueDate || "",
          createdAt: t.createdAt || new Date().toISOString(),
        }));

        normalised.sort((a, b) =>
          a.createdAt > b.createdAt ? 1 : -1
        );
        setTasks(normalised);
      }
    } catch (err) {
      console.error("Failed to load tasks", err);
    }
  }, []);

  // Save whenever tasks change
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "lifeOS_tasks",
          JSON.stringify(tasks)
        );
      }
    } catch (err) {
      console.error("Failed to save tasks", err);
    }
  }, [tasks]);

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
      assignedTo,
      priority,
      dueDate,
      createdAt: now,
    };

    setTasks((prev) => [...prev, newTask]);
    setTitle("");
    setNotes("");
    setStatus("Inbox");
    setAssignedTo("");
    setPriority("Normal");
    setDueDate("");
  };

  const updateTaskStatus = (id: string, newStatus: Status) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: newStatus } : t
      )
    );
  };

  const updateTaskPriority = (id: string, newPriority: Priority) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, priority: newPriority } : t
      )
    );
  };

  const updateTaskAssignedTo = (
    id: string,
    newAssigned: "" | "Will" | "Michelle"
  ) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, assignedTo: newAssigned } : t
      )
    );
  };

  const updateTaskDueDate = (id: string, newDate: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, dueDate: newDate } : t
      )
    );
  };

  const deleteTask = (id: string) => {
    if (!confirm("Delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const isOverdue = (task: Task) =>
    task.dueDate && task.dueDate < todayStr;
  const isDueToday = (task: Task) =>
    task.dueDate && task.dueDate === todayStr;

  // Apply filters + search
  let filtered = [...tasks];

  if (statusFilter !== "All") {
    filtered = filtered.filter((t) => t.status === statusFilter);
  }

  if (assignmentFilter !== "All") {
    filtered = filtered.filter((t) => {
      if (assignmentFilter === "Unassigned") {
        return !t.assignedTo;
      }
      return t.assignedTo === assignmentFilter;
    });
  }

  if (priorityFilter !== "All") {
    filtered = filtered.filter(
      (t) => t.priority === priorityFilter
    );
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q)
    );
  }

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
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Tasks</h1>
          <p className="text-sm text-zinc-400">
            Shared task board for you & Michelle – assign, prioritise
            and keep life admin under control.
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
              placeholder="e.g. Renew car tax, order materials..."
            />
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as Status)
              }
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
            <label className="block text-zinc-400">Assigned to</label>
            <select
              value={assignedTo}
              onChange={(e) =>
                setAssignedTo(e.target.value as "" | "Will" | "Michelle")
              }
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            >
              <option value="">Unassigned</option>
              <option value="Will">Will</option>
              <option value="Michelle">Michelle</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4 mt-3">
          <div className="space-y-1">
            <label className="block text-zinc-400">Priority</label>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as Priority)
              }
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">
              Due date (optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="block text-zinc-400">
              Notes (optional)
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
              placeholder="e.g. need reg number, call before 5pm..."
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
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
        <div className="grid gap-3 md:grid-cols-4">
          {/* Status filter */}
          <div className="space-y-1">
            <label className="block text-zinc-400">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as Status | "All"
                )
              }
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            >
              <option value="All">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Assignment filter */}
          <div className="space-y-1">
            <label className="block text-zinc-400">
              Assigned to
            </label>
            <select
              value={assignmentFilter}
              onChange={(e) =>
                setAssignmentFilter(
                  e.target.value as
                    | "All"
                    | "Will"
                    | "Michelle"
                    | "Unassigned"
                )
              }
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            >
              <option value="All">All</option>
              <option value="Will">Will</option>
              <option value="Michelle">Michelle</option>
              <option value="Unassigned">Unassigned</option>
            </select>
          </div>

          {/* Priority filter */}
          <div className="space-y-1">
            <label className="block text-zinc-400">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(
                  e.target.value as Priority | "All"
                )
              }
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            >
              <option value="All">All</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="space-y-1">
            <label className="block text-zinc-400">
              Search
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
              placeholder="Title or notes..."
            />
          </div>
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
              <h2 className="font-semibold text-zinc-200 text-xs">
                {s}
              </h2>
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
                      <div className="flex flex-wrap gap-2 mt-1">
                        {/* Assigned pill */}
                        {task.assignedTo && (
                          <span className="px-2 py-0.5 rounded-full border border-sky-500 text-sky-300 text-[10px]">
                            {task.assignedTo}
                          </span>
                        )}
                        {/* Priority pill */}
                        <span
                          className={
                            "px-2 py-0.5 rounded-full border text-[10px] " +
                            (task.priority === "High"
                              ? "border-red-500 text-red-300 bg-red-900/40"
                              : task.priority === "Low"
                              ? "border-zinc-500 text-zinc-300 bg-zinc-900"
                              : "border-amber-500 text-amber-300 bg-amber-900/40")
                          }
                        >
                          {task.priority} priority
                        </span>
                        {/* Due date pill */}
                        {task.dueDate && (
                          <span
                            className={
                              "px-2 py-0.5 rounded-full border text-[10px] " +
                              (isOverdue(task)
                                ? "border-red-500 text-red-300 bg-red-900/40"
                                : isDueToday(task)
                                ? "border-amber-500 text-amber-300 bg-amber-900/40"
                                : "border-zinc-500 text-zinc-300 bg-zinc-900")
                            }
                          >
                            {isOverdue(task)
                              ? `Overdue · ${task.dueDate}`
                              : isDueToday(task)
                              ? "Due today"
                              : `Due · ${task.dueDate}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-[10px] text-zinc-500 hover:text-red-400"
                      title="Delete task"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 mt-1">
                    <div className="flex flex-wrap gap-2">
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
                      <select
                        value={task.assignedTo}
                        onChange={(e) =>
                          updateTaskAssignedTo(
                            task.id,
                            e.target
                              .value as "" | "Will" | "Michelle"
                          )
                        }
                        className="rounded bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-100"
                      >
                        <option value="">Unassigned</option>
                        <option value="Will">Will</option>
                        <option value="Michelle">Michelle</option>
                      </select>
                      <select
                        value={task.priority}
                        onChange={(e) =>
                          updateTaskPriority(
                            task.id,
                            e.target.value as Priority
                          )
                        }
                        className="rounded bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-100"
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="date"
                        value={task.dueDate}
                        onChange={(e) =>
                          updateTaskDueDate(task.id, e.target.value)
                        }
                        className="rounded bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-100"
                      />
                      <span className="text-[10px] text-zinc-500">
                        {new Date(
                          task.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
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
