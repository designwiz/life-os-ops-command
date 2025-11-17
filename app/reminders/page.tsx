"use client";

import React, { useEffect, useState } from "react";

type Reminder = {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD (or empty)
  completed: boolean;
  createdAt: string;
  assignedTo: "" | "Will" | "Michelle";
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState<
    "" | "Will" | "Michelle"
  >("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Active" | "Completed"
  >("All");
  const [assignmentFilter, setAssignmentFilter] = useState<
    "All" | "Will" | "Michelle" | "Unassigned"
  >("All");
  const [search, setSearch] = useState("");

  const todayStr = new Date().toISOString().slice(0, 10);

  // Load from shared localStorage
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const saved = window.localStorage.getItem("lifeOS_reminders");
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Reminder>[];

        const normalised: Reminder[] = parsed.map((r) => ({
          id:
            r.id ||
            `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          title: r.title || "",
          dueDate: r.dueDate || "",
          completed: !!r.completed,
          createdAt: r.createdAt || new Date().toISOString(),
          assignedTo:
            (r.assignedTo as "" | "Will" | "Michelle") || "",
        }));

        normalised.sort((a, b) =>
          a.createdAt > b.createdAt ? 1 : -1
        );
        setReminders(normalised);
      }
    } catch (err) {
      console.error("Failed to load reminders", err);
    }
  }, []);

  // Save whenever reminders change
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "lifeOS_reminders",
          JSON.stringify(reminders)
        );
      }
    } catch (err) {
      console.error("Failed to save reminders", err);
    }
  }, [reminders]);

  const addReminder = () => {
    if (!title.trim()) {
      alert("Reminder text is required.");
      return;
    }
    const now = new Date().toISOString();
    const newReminder: Reminder = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: title.trim(),
      dueDate,
      completed: false,
      createdAt: now,
      assignedTo,
    };
    setReminders((prev) => [...prev, newReminder]);
    setTitle("");
    setDueDate("");
    setAssignedTo("");
  };

  const toggleCompleted = (id: string) => {
    setReminders((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, completed: !r.completed } : r
      )
    );
  };

  const deleteReminder = (id: string) => {
    if (!confirm("Delete this reminder?")) return;
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const updateAssignedTo = (
    id: string,
    newAssigned: "" | "Will" | "Michelle"
  ) => {
    setReminders((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, assignedTo: newAssigned } : r
      )
    );
  };

  const updateDueDate = (id: string, newDate: string) => {
    setReminders((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, dueDate: newDate } : r
      )
    );
  };

  const isOverdue = (r: Reminder) =>
    r.dueDate && r.dueDate < todayStr && !r.completed;
  const isToday = (r: Reminder) =>
    r.dueDate && r.dueDate === todayStr && !r.completed;

  // Apply filters + search
  let filtered = [...reminders];

  if (statusFilter === "Active") {
    filtered = filtered.filter((r) => !r.completed);
  } else if (statusFilter === "Completed") {
    filtered = filtered.filter((r) => r.completed);
  }

  if (assignmentFilter !== "All") {
    filtered = filtered.filter((r) => {
      if (assignmentFilter === "Unassigned") {
        return !r.assignedTo;
      }
      return r.assignedTo === assignmentFilter;
    });
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter((r) =>
      r.title.toLowerCase().includes(q)
    );
  }

  const activeReminders = filtered.filter((r) => !r.completed);
  const completedReminders = filtered.filter((r) => r.completed);

  const totalActive = reminders.filter((r) => !r.completed).length;
  const totalCompleted = reminders.filter((r) => r.completed).length;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Reminders
          </h1>
          <p className="text-sm text-zinc-400">
            Shared list for you and Michelle – life admin, calls, school
            stuff, bills and everything in between.
          </p>
        </div>
        <a
          href="/"
          className="text-xs px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition"
        >
          ⬅ Back to dashboard
        </a>
      </header>

      {/* Summary */}
      <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-zinc-300">
              Overview
            </h2>
            <p className="text-zinc-400">
              Active reminders:{" "}
              <span className="text-sky-300 font-semibold">
                {totalActive}
              </span>{" "}
              · Completed:{" "}
              <span className="text-emerald-300 font-semibold">
                {totalCompleted}
              </span>
            </p>
          </div>
          <div className="text-right text-[11px] text-zinc-500">
            <p>Total reminders logged: {reminders.length}</p>
          </div>
        </div>
      </section>

      {/* New reminder form */}
      <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">
          Add reminder
        </h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2 space-y-1">
            <label className="block text-zinc-400">Text</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
              placeholder="e.g. Call GP, pay electricity, send note to school..."
            />
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
          <div className="space-y-1">
            <label className="block text-zinc-400">
              Assigned to
            </label>
            <select
              value={assignedTo}
              onChange={(e) =>
                setAssignedTo(
                  e.target.value as "" | "Will" | "Michelle"
                )
              }
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            >
              <option value="">Unassigned</option>
              <option value="Will">Will</option>
              <option value="Michelle">Michelle</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={addReminder}
            className="text-xs px-3 py-2 rounded-full border border-sky-500 bg-sky-900/40 hover:bg-sky-800/60 text-sky-100 transition"
          >
            + Add reminder
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
            reminder{filtered.length === 1 ? "" : "s"}
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
                  e.target.value as "All" | "Active" | "Completed"
                )
              }
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
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

          {/* Search */}
          <div className="md:col-span-2 space-y-1">
            <label className="block text-zinc-400">
              Search
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
              placeholder="Search text..."
            />
          </div>
        </div>
      </section>

      {/* Active reminders */}
      <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-300">
            Active
          </h2>
          <span className="text-[11px] text-zinc-500">
            {activeReminders.length} item
            {activeReminders.length === 1 ? "" : "s"}
          </span>
        </div>
        {activeReminders.length === 0 ? (
          <p className="text-[11px] text-zinc-500">
            No active reminders. Clear board – nice.
          </p>
        ) : (
          <ul className="space-y-2">
            {activeReminders.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 p-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <label className="flex items-start gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={r.completed}
                      onChange={() => toggleCompleted(r.id)}
                      className="mt-[2px]"
                    />
                    <div>
                      <p className="text-zinc-100 text-xs">
                        {r.title}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {/* Due badge */}
                        {r.dueDate && (
                          <span
                            className={
                              "px-2 py-0.5 rounded-full border text-[10px] " +
                              (isOverdue(r)
                                ? "border-red-500 text-red-300 bg-red-900/40"
                                : isToday(r)
                                ? "border-amber-500 text-amber-300 bg-amber-900/40"
                                : "border-zinc-600 text-zinc-300 bg-zinc-900")
                            }
                          >
                            {isOverdue(r)
                              ? `Overdue · ${r.dueDate}`
                              : isToday(r)
                              ? `Due today`
                              : `Due · ${r.dueDate}`}
                          </span>
                        )}
                        {/* Assigned pill */}
                        {r.assignedTo && (
                          <span className="px-2 py-0.5 rounded-full border border-sky-500 text-sky-300 text-[10px]">
                            {r.assignedTo}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                  <button
                    onClick={() => deleteReminder(r.id)}
                    className="text-[10px] text-zinc-500 hover:text-red-400"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={r.assignedTo}
                      onChange={(e) =>
                        updateAssignedTo(
                          r.id,
                          e.target.value as
                            | ""
                            | "Will"
                            | "Michelle"
                        )
                      }
                      className="rounded bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-100"
                    >
                      <option value="">Unassigned</option>
                      <option value="Will">Will</option>
                      <option value="Michelle">Michelle</option>
                    </select>
                    <input
                      type="date"
                      value={r.dueDate}
                      onChange={(e) =>
                        updateDueDate(r.id, e.target.value)
                      }
                      className="rounded bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-100"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(
                      r.createdAt
                    ).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Completed reminders */}
      <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-300">
            Completed
          </h2>
        </div>
        {completedReminders.length === 0 ? (
          <p className="text-[11px] text-zinc-500">
            Nothing completed yet. Future You is watching…
          </p>
        ) : (
          <ul className="space-y-2">
            {completedReminders.map((r) => (
              <li
                key={r.id}
                className="flex items-start justify-between gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 p-2 opacity-75"
              >
                <div>
                  <p className="text-zinc-300 text-xs line-through">
                    {r.title}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {r.dueDate && (
                      <span className="text-[11px] text-zinc-500">
                        Due was: {r.dueDate}
                      </span>
                    )}
                    {r.assignedTo && (
                      <span className="px-2 py-0.5 rounded-full border border-sky-500 text-sky-300 text-[10px]">
                        {r.assignedTo}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleCompleted(r.id)}
                  className="text-[10px] text-zinc-400 hover:text-emerald-400"
                >
                  ↺ Undo
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
