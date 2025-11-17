"use client";

import React, { useEffect, useState } from "react";

type Reminder = {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD (or empty)
  completed: boolean;
  createdAt: string;
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

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
          ? `lifeOS_reminders_${currentProfileId}`
          : "lifeOS_reminders";

      const saved = window.localStorage.getItem(key);
      if (saved) {
        const parsed: Reminder[] = JSON.parse(saved);
        parsed.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
        setReminders(parsed);
      }
    } catch (err) {
      console.error("Failed to load reminders", err);
    } finally {
      setProfileLoaded(true);
    }
  }, []);


  // Save whenever reminders change
  useEffect(() => {
    if (!profileLoaded) return;
    try {
      if (typeof window !== "undefined") {
        const key =
          profileId !== null
            ? `lifeOS_reminders_${profileId}`
            : "lifeOS_reminders";
        window.localStorage.setItem(key, JSON.stringify(reminders));
      }
    } catch (err) {
      console.error("Failed to save reminders", err);
    }
  }, [reminders, profileId, profileLoaded]);


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
    };
    setReminders((prev) => [...prev, newReminder]);
    setTitle("");
    setDueDate("");
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

  const todayStr = new Date().toISOString().slice(0, 10);

  // Split into active + completed
  const activeReminders = reminders
    .filter((r) => !r.completed)
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate > b.dueDate ? 1 : -1;
    });

  const completedReminders = reminders
    .filter((r) => r.completed)
    .sort((a, b) => (a.completed && b.completed ? (a.dueDate > b.dueDate ? -1 : 1) : 0));

  const isOverdue = (r: Reminder) =>
    r.dueDate && r.dueDate < todayStr && !r.completed;
  const isToday = (r: Reminder) =>
    r.dueDate && r.dueDate === todayStr && !r.completed;

  const activeCount = activeReminders.length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Reminders</h1>
          <p className="text-sm text-zinc-400">
            Shared list for you and your wife – life admin, calls, school stuff, etc.
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
                {activeCount}
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
          <div className="md:col-span-3 space-y-1">
            <label className="block text-zinc-400">Text</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
              placeholder="e.g. Call GP, pay electricity, order school uniforms..."
            />
          </div>
          <div className="space-y-1">
            <label className="block text-zinc-400">Due date (optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
            />
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
                className="flex items-start justify-between gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 p-2"
              >
                <label className="flex items-start gap-2 flex-1">
                  <input
                    type="checkbox"
                    checked={r.completed}
                    onChange={() => toggleCompleted(r.id)}
                    className="mt-[2px]"
                  />
                  <div>
                    <p className="text-zinc-100 text-xs">{r.title}</p>
                    {r.dueDate && (
                      <p className="text-[11px] mt-0.5">
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
                      </p>
                    )}
                  </div>
                </label>
                <button
                  onClick={() => deleteReminder(r.id)}
                  className="text-[10px] text-zinc-500 hover:text-red-400"
                  title="Delete"
                >
                  ✕
                </button>
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
          <span className="text-[11px] text-zinc-500">
            {completedReminders.length} item
            {completedReminders.length === 1 ? "" : "s"}
          </span>
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
                className="flex items-start justify-between gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 p-2 opacity-70"
              >
                <div>
                  <p className="text-zinc-300 text-xs line-through">
                    {r.title}
                  </p>
                  {r.dueDate && (
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Due was: {r.dueDate}
                    </p>
                  )}
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
