"use client";

import React, { useEffect, useState } from "react";

type TaskStatus = "Today" | "Backlog" | "Waiting" | "Done";
type TaskPriority = "Low" | "Medium" | "High";
type StatusFilter = "All" | TaskStatus;

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  dueDate: string;
  createdAt: string;
};

const STATUSES: TaskStatus[] = ["Today", "Backlog", "Waiting", "Done"];
const PRIORITIES: TaskPriority[] = ["Low", "Medium", "High"];
const STATUS_FILTERS: StatusFilter[] = [
  "All",
  "Today",
  "Backlog",
  "Waiting",
  "Done",
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("Medium");
  const [newStatus, setNewStatus] = useState<TaskStatus>("Today");
  const [newDueDate, setNewDueDate] = useState("");

  // Filters
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("All");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterSearch, setFilterSearch] = useState<string>("");

  // Load tasks from localStorage
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const saved = window.localStorage.getItem("lifeOS_tasks");
      if (saved) {
        const parsed: Task[] = JSON.parse(saved);
        parsed.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
        setTasks(parsed);
      }
    } catch (err) {
      console.error("Failed to load tasks", err);
    }
  }, []);

  // Save tasks whenever they change
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("lifeOS_tasks", JSON.stringify(tasks));
      }
    } catch (err) {
      console.error("Failed to save tasks", err);
    }
  }, [tasks]);

  const addTask = () => {
    if (!newTitle.trim()) {
      alert("Task title is required.");
      return;
    }
    const now = new Date().toISOString();
    const task: Task = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: newTitle.trim(),
      status: newStatus,
      priority: newPriority,
      category: newCategory.trim(),
      dueDate: newDueDate,
      createdAt: now,
    };
    setTasks((prev) => [...prev, task]);
    setNewTitle("");
    setNewCategory("");
    setNewPriority("Medium");
    setNewStatus("Today");
    setNewDueDate("");
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  };

  const updateTaskPriority = (id: string, priority: TaskPriority) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, priority } : t))
    );
  };

  const deleteTask = (id: string) => {
    if (!confirm("Delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Unique categories for filter dropdown
  const categories = Array.from(
    new Set(tasks.map((t) => t.category).filter((c) => c.trim() !== ""))
  ).sort();

  // Apply filters
  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== "All" && t.status !== filterStatus) return false;
    if (filterCategory && t.category !== filterCategory) return false;
    if (
      filterSearch &&
      !t.title.toLowerCase().includes(filterSearch.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const tasksByStatus: Record<TaskStatus, Task[]> = {
    Today: [],
    Backlog: [],
    Waiting: [],
    Done: [],
  };

  for (const t of filteredTasks) {
    tasksByStatus[t.status].push(t);
  }

  const totalVisible = filteredTasks.length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Tasks Board</h1>
          <p className="text-sm text-zinc-400">
            Manage life ops, projects, and WillMadeThis tasks.
          </p>
        </div>
        <a
          href="/"
          className="text-xs px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition"
        >
          ⬅ Back to dashboard
        </a>
      </header>

      {/* Filters */}
      <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-zinc-300">
            Filters
          </h2>
          <p className="text-[11px] text-zinc-500">
            Showing{" "}
            <span className="text-zinc-100 font-semibold">
              {totalVisible}
            </span>{" "}
            task{totalVisible === 1 ? "" : "s"}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <label className="block text-zinc-400">Status</label>
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as StatusFilter)
              }
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="block text-zinc-400">Search</label>
            <input
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
              placeholder="Search by title..."
            />
          </div>
        </div>
      </section>

      {/* New task form */}
      <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">
          Add Task
        </h2>
        <div className="grid gap-3 md:grid-cols-5 text-xs">
          <div className="md:col-span-2 space-y-1">
            <label className="block text-zinc-400">Title</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
              placeholder="e.g. Finish order for John"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">Category</label>
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
              placeholder="Home / WillMadeThis / Scouts"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">Priority</label>
            <select
              value={newPriority}
              onChange={(e) =>
                setNewPriority(e.target.value as TaskPriority)
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
            <label className="block text-zinc-400">Status</label>
            <select
              value={newStatus}
              onChange={(e) =>
                setNewStatus(e.target.value as TaskStatus)
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
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-5 text-xs">
          <div className="md:col-span-2 space-y-1">
            <label className="block text-zinc-400">Due date</label>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={addTask}
              className="w-full md:w-auto text-xs px-3 py-2 rounded-full border border-purple-500 bg-purple-900/40 hover:bg-purple-800/60 text-purple-100 transition"
            >
              + Add task
            </button>
          </div>
        </div>
      </section>

      {/* Board */}
      <section className="grid gap-4 md:grid-cols-4">
        {STATUSES.map((status) => (
          <div
            key={status}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3 text-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-zinc-200">{status}</h2>
              <span className="text-zinc-500">
                {tasksByStatus[status].length}
              </span>
            </div>
            <div className="space-y-2">
              {tasksByStatus[status].map((task) => (
                <article
                  key={task.id}
                  className="rounded-xl border border-zinc-700 bg-zinc-800/80 p-2 space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-zinc-100 text-xs">
                        {task.title}
                      </p>
                      {task.category && (
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {task.category}
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
                  <div className="flex flex-wrap items-center justify-between gap-1 mt-1">
                    <select
                      value={task.priority}
                      onChange={(e) =>
                        updateTaskPriority(
                          task.id,
                          e.target.value as TaskPriority
                        )
                      }
                      className="rounded bg-zinc-900 border border-zinc-700 px-1 py-0.5 text-[10px] text-zinc-100"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <select
                      value={task.status}
                      onChange={(e) =>
                        updateTaskStatus(
                          task.id,
                          e.target.value as TaskStatus
                        )
                      }
                      className="rounded bg-zinc-900 border border-zinc-700 px-1 py-0.5 text-[10px] text-zinc-100"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  {task.dueDate && (
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Due: {task.dueDate}
                    </p>
                  )}
                </article>
              ))}
              {tasksByStatus[status].length === 0 && (
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
