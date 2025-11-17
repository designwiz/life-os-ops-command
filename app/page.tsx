"use client";

import React, { useState, useEffect } from "react";

type TodayState = {
  date: string;
  weightKg: string;
  sleepHours: string;
  mood: string;
  hydrationLitres: string;
  smoothieDone: boolean;
  workoutDone: boolean;
};

type HistoryEntry = TodayState & {
  savedAt?: string;
};

const INITIAL_STATE: TodayState = {
  date: "",
  weightKg: "",
  sleepHours: "",
  mood: "",
  hydrationLitres: "",
  smoothieDone: false,
  workoutDone: false,
};

export default function HomePage() {
  const [today, setToday] = useState<TodayState>(INITIAL_STATE);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [todayTaskCount, setTodayTaskCount] = useState<number>(0);
  const [openOrdersCount, setOpenOrdersCount] = useState<number>(0);
  const [activeRemindersCount, setActiveRemindersCount] =
    useState<number>(0);
  const [profileName, setProfileName] = useState<string>("Guest");

  // Michelle mode = change behaviour / visibility
  const michelleMode =
    profileName.trim().toLowerCase() === "michelle";

  // Load "today", history, counts, and profile (all shared data)
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      // ---- Profile ----
      try {
        const savedProfile = window.localStorage.getItem(
          "lifeOS_currentProfile"
        );
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile) as {
            name?: string;
          };
          if (parsed.name) {
            setProfileName(parsed.name);
          } else {
            setProfileName("Guest");
          }
        } else {
          setProfileName("Guest");
        }
      } catch {
        setProfileName("Guest");
      }

      // ---- Today (shared/global) ----
      const savedToday = window.localStorage.getItem("lifeOS_today");
      if (savedToday) {
        setToday(JSON.parse(savedToday));
      } else {
        const now = new Date();
        const formatted = now.toISOString().slice(0, 10); // YYYY-MM-DD
        setToday((prev) => ({ ...prev, date: formatted }));
      }

      // ---- History (shared/global) ----
      const savedHistory = window.localStorage.getItem(
        "lifeOS_history"
      );
      if (savedHistory) {
        const parsed: HistoryEntry[] = JSON.parse(savedHistory);
        parsed.sort((a, b) => (a.date > b.date ? 1 : -1)); // oldest → newest
        setHistory(parsed);
      }

      // ---- Tasks – use shared key ----
      const savedTasks = window.localStorage.getItem("lifeOS_tasks");
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks) as { status?: string }[];
        const count = parsed.filter(
          (t) => t.status === "Today"
        ).length;
        setTodayTaskCount(count);
      } else {
        setTodayTaskCount(0);
      }

      // ---- Orders – shared key ----
      const savedOrders = window.localStorage.getItem("lifeOS_orders");
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders) as { status?: string }[];
        const open = parsed.filter(
          (o) => o.status !== "Completed"
        ).length;
        setOpenOrdersCount(open);
      } else {
        setOpenOrdersCount(0);
      }

      // ---- Reminders – shared key ----
      const savedReminders = window.localStorage.getItem(
        "lifeOS_reminders"
      );
      if (savedReminders) {
        const parsed = JSON.parse(savedReminders) as {
          completed?: boolean;
        }[];
        const active = parsed.filter((r) => !r.completed).length;
        setActiveRemindersCount(active);
      } else {
        setActiveRemindersCount(0);
      }
    } catch (err) {
      console.error("Failed to load saved state", err);
    }
  }, []);

  // Save "today" whenever it changes
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "lifeOS_today",
          JSON.stringify(today)
        );
      }
    } catch (err) {
      console.error("Failed to save today state", err);
    }
  }, [today]);

  // Register service worker for PWA
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) =>
          console.error("Service worker registration failed", err)
        );
    }
  }, []);

  const updateField = (
    field: keyof TodayState,
    value: string | boolean
  ) => {
    setToday((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveToHistory = () => {
    if (!today.date) {
      alert("Set a date before saving to history.");
      return;
    }
    if (typeof window === "undefined") return;

    const entry: HistoryEntry = {
      ...today,
      savedAt: new Date().toISOString(),
    };

    try {
      const existing = window.localStorage.getItem("lifeOS_history");
      const oldHistory: HistoryEntry[] = existing
        ? JSON.parse(existing)
        : [];
      const filtered = oldHistory.filter(
        (h) => h.date !== entry.date
      );
      filtered.push(entry);
      filtered.sort((a, b) => (a.date > b.date ? 1 : -1)); // oldest → newest
      window.localStorage.setItem(
        "lifeOS_history",
        JSON.stringify(filtered)
      );
      setHistory(filtered);
      alert("Saved today to history ✅");
    } catch (err) {
      console.error("Failed to save history", err);
      alert("Could not save to history");
    }
  };

  const hydrationNumber = parseFloat(today.hydrationLitres || "0");
  const hydrationPercent = Math.min(
    100,
    Math.max(0, Math.round((hydrationNumber / 2) * 100)) // target 2L
  );

  const openTasks = [
    !today.workoutDone && "Treadmill / walk 20 mins",
    !today.smoothieDone && "Make smoothie",
    "Prep food for tomorrow",
  ].filter(Boolean) as string[];

  const quote =
    "Discipline is doing what needs to be done, even when you don’t feel like it.";

  // ---- STREAK CALCULATION ----

  const calcStreakFromHistory = (
    entries: HistoryEntry[],
    field: "smoothieDone" | "workoutDone",
    todayDate: string
  ) => {
    const sorted = [...entries]
      .filter((e) => e.date && e.date !== todayDate)
      .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest → oldest

    let streak = 0;
    for (const entry of sorted) {
      if (entry[field]) {
        streak += 1;
      } else {
        break;
      }
    }
    return streak;
  };

  const smoothieHistoryStreak = calcStreakFromHistory(
    history,
    "smoothieDone",
    today.date
  );
  const workoutHistoryStreak = calcStreakFromHistory(
    history,
    "workoutDone",
    today.date
  );

  const smoothieStreak = today.smoothieDone
    ? smoothieHistoryStreak + 1
    : smoothieHistoryStreak;
  const workoutStreak = today.workoutDone
    ? workoutHistoryStreak + 1
    : workoutHistoryStreak;

  const bestSmoothieStreak = (() => {
    if (!history.length) return smoothieStreak;
    let best = 0;
    let current = 0;
    const sorted = [...history].sort((a, b) =>
      a.date > b.date ? 1 : -1
    );
    for (const entry of sorted) {
      if (entry.smoothieDone) {
        current += 1;
        if (current > best) best = current;
      } else {
        current = 0;
      }
    }
    if (today.smoothieDone) {
      best = Math.max(best, smoothieStreak);
    }
    return best;
  })();

  const bestWorkoutStreak = (() => {
    if (!history.length) return workoutStreak;
    let best = 0;
    let current = 0;
    const sorted = [...history].sort((a, b) =>
      a.date > b.date ? 1 : -1
    );
    for (const entry of sorted) {
      if (entry.workoutDone) {
        current += 1;
        if (current > best) best = current;
      } else {
        current = 0;
      }
    }
    if (today.workoutDone) {
      best = Math.max(best, workoutStreak);
    }
    return best;
  })();

  // ---- OVERALL STREAK BADGE ----

  const overallStreak = Math.min(smoothieStreak, workoutStreak);
  let streakLabel = "Streak offline";
  let streakClass =
    "bg-red-900/40 border-red-600/70 text-red-300";
  if (overallStreak >= 1 && overallStreak < 3) {
    streakLabel = "Streak warming up";
    streakClass =
      "bg-amber-900/40 border-amber-500/70 text-amber-200";
  } else if (overallStreak >= 3) {
    streakLabel = "Streak active";
    streakClass =
      "bg-emerald-900/40 border-emerald-500/70 text-emerald-200";
  }

  // ---- WEEKLY SUMMARY ----

  const weeklySummary = (() => {
    const combined: HistoryEntry[] = [...history];
    const todayHasData =
      today.date &&
      (today.weightKg ||
        today.sleepHours ||
        today.hydrationLitres ||
        today.mood ||
        today.smoothieDone ||
        today.workoutDone);

    if (todayHasData) {
      const exists = combined.some((e) => e.date === today.date);
      if (!exists) {
        combined.push({ ...today });
      }
    }

    if (!combined.length) {
      return null;
    }

    combined.sort((a, b) => (a.date > b.date ? 1 : -1));
    const last7 = combined.slice(-7);

    if (!last7.length) return null;

    let weightSum = 0;
    let weightCount = 0;
    let sleepSum = 0;
    let sleepCount = 0;
    let hydrationSum = 0;
    let hydrationCount = 0;
    let smoothieDays = 0;
    let workoutDays = 0;

    for (const entry of last7) {
      const w = parseFloat(entry.weightKg || "0");
      if (!Number.isNaN(w) && w > 0) {
        weightSum += w;
        weightCount += 1;
      }
      const s = parseFloat(entry.sleepHours || "0");
      if (!Number.isNaN(s) && s > 0) {
        sleepSum += s;
        sleepCount += 1;
      }
      const h = parseFloat(entry.hydrationLitres || "0");
      if (!Number.isNaN(h) && h > 0) {
        hydrationSum += h;
        hydrationCount += 1;
      }
      if (entry.smoothieDone) smoothieDays += 1;
      if (entry.workoutDone) workoutDays += 1;
    }

    return {
      days: last7.length,
      avgWeight: weightCount ? weightSum / weightCount : null,
      avgSleep: sleepCount ? sleepSum / sleepCount : null,
      avgHydration: hydrationCount
        ? hydrationSum / hydrationCount
        : null,
      smoothieDays,
      workoutDays,
    };
  })();

  // ---- RENDER ----

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Will&apos;s Ops Command
          </h1>
          <p className="text-sm text-zinc-400">
            Daily Life Ops • {today.date || "Set date below"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Profile:{" "}
            <span className="text-zinc-100 font-semibold">
              {profileName || "Guest"}
            </span>{" "}
            ·{" "}
            <a
              href="/login"
              className="underline-offset-2 underline text-sky-400 hover:text-sky-300"
            >
              switch / manage profiles
            </a>
          </p>
          {michelleMode && (
            <p className="mt-1 text-[11px] text-pink-400">
              Michelle mode: health stats hidden on this view 💕
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-zinc-400 items-center">
          <span className="px-2 py-1 rounded-full bg-emerald-900/40 border border-emerald-600/60">
            STATUS: GREEN
          </span>
          <span className="px-2 py-1 rounded-full bg-zinc-900 border border-zinc-700">
            Theme: Tactical / Shared Ops
          </span>
          <span
            className={
              "px-2 py-1 rounded-full border text-xs flex items-center gap-2 " +
              streakClass
            }
          >
            <span
              className="inline-block h-2 w-2 rounded-full bg-current"
              aria-hidden="true"
            />
            {streakLabel} ({overallStreak} day
            {overallStreak === 1 ? "" : "s"})
          </span>
          <a
            href="/tasks"
            className="flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500 text-purple-300 hover:bg-purple-500/10 transition"
          >
            <span>Tasks board</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/70 border border-purple-500">
              Today: {todayTaskCount}
            </span>
          </a>
          <a
            href="/orders"
            className="flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500 text-amber-200 hover:bg-amber-500/10 transition"
          >
            <span>Orders</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/70 border border-amber-500">
              Open: {openOrdersCount}
            </span>
          </a>
          <a
            href="/reminders"
            className="flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500 text-sky-300 hover:bg-sky-500/10 transition"
          >
            <span>Reminders</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-900/70 border border-sky-500">
              Active: {activeRemindersCount}
            </span>
          </a>
          <a
            href="/history"
            className="px-3 py-1 rounded-full border border-sky-600 text-sky-400 hover:bg-sky-600/10 transition"
          >
            View history
          </a>
        </div>
      </header>

      {/* Date + quick controls */}
      <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Day:</span>
          <input
            type="date"
            value={today.date}
            onChange={(e) => updateField("date", e.target.value)}
            className="rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setToday(INITIAL_STATE)}
            className="text-xs px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 hover	bg-zinc-800 transition"
          >
            Reset today
          </button>
          <button
            onClick={saveToHistory}
            className="text-xs px-3 py-1 rounded-full border border-emerald-600 bg-emerald-900/40 hover:bg-emerald-800/60 transition"
          >
            Save today to history
          </button>
        </div>
      </section>

      {/* Health / vitals – hidden in Michelle mode */}
      {!michelleMode && (
        <div className="grid gap-4 md:grid-cols-4">
          {/* Vital Stats */}
          <section className="md:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">
              Vital Stats
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-zinc-400 text-xs">Weight (kg)</p>
                <input
                  type="number"
                  inputMode="decimal"
                  value={today.weightKg}
                  onChange={(e) =>
                    updateField("weightKg", e.target.value)
                  }
                  className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
                  placeholder="Enter weight"
                />
              </div>
              <div className="space-y-2">
                <p className="text-zinc-400 text-xs">Sleep (hours)</p>
                <input
                  type="number"
                  inputMode="decimal"
                  value={today.sleepHours}
                  onChange={(e) =>
                    updateField("sleepHours", e.target.value)
                  }
                  className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100"
                  placeholder="e.g. 7.0"
                />
                <p className="text-zinc-400 text-xs mt-1">Mood</p>
                <select
                  value={today.mood}
                  onChange={(e) =>
                    updateField("mood", e.target.value)
                  }
                  className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100 text-xs"
                >
                  <option value="">Select mood</option>
                  <option value="Good">Good</option>
                  <option value="Okay">Okay</option>
                  <option value="Low">Low</option>
                  <option value="Stressed">Stressed</option>
                </select>
              </div>
            </div>
          </section>

          {/* Hydration */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">
              Hydration
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-xs">
                  Litres today
                </span>
                <input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={today.hydrationLitres}
                  onChange={(e) =>
                    updateField(
                      "hydrationLitres",
                      e.target.value
                    )
                  }
                  className="w-24 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-zinc-100 text-xs"
                  placeholder="0.0"
                />
              </div>
              <p className="text-xs text-zinc-400">
                Target: 2.0 L • {hydrationPercent}% complete
              </p>
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all"
                  style={{ width: `${hydrationPercent}%` }}
                />
              </div>
            </div>
          </section>

          {/* Habits + Streaks */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">
              Core Habits & Streaks
            </h2>
            <div className="space-y-3 text-sm">
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={today.smoothieDone}
                    onChange={(e) =>
                      updateField(
                        "smoothieDone",
                        e.target.checked
                      )
                    }
                  />
                  <span>Smoothie done</span>
                </label>
                <p className="text-xs text-zinc-400">
                  Current streak:{" "}
                  <span className="text-emerald-400 font-semibold">
                    {smoothieStreak}
                  </span>{" "}
                  day{smoothieStreak === 1 ? "" : "s"} • Best:{" "}
                  <span className="text-emerald-400 font-semibold">
                    {bestSmoothieStreak}
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={today.workoutDone}
                    onChange={(e) =>
                      updateField(
                        "workoutDone",
                        e.target.checked
                      )
                    }
                  />
                  <span>Workout / treadmill</span>
                </label>
                <p className="text-xs text-zinc-400">
                  Current streak:{" "}
                  <span className="text-emerald-400 font-semibold">
                    {workoutStreak}
                  </span>{" "}
                  day{workoutStreak === 1 ? "" : "s"} • Best:{" "}
                  <span className="text-emerald-400 font-semibold">
                    {bestWorkoutStreak}
                  </span>
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Weekly summary + Today’s Ops */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <section className="md:col-span-1 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-2">
            Weekly Summary
          </h2>
          {!weeklySummary ? (
            <p className="text-xs text-zinc-400">
              Log and save a few days to see your weekly stats.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              <p className="text-zinc-400">
                Days counted:{" "}
                <span className="text-zinc-100 font-semibold">
                  {weeklySummary.days}
                </span>
              </p>
              <p className="text-zinc-400">
                Avg weight:{" "}
                <span className="text-zinc-100 font-semibold">
                  {weeklySummary.avgWeight
                    ? `${weeklySummary.avgWeight.toFixed(
                        1
                      )} kg`
                    : "—"}
                </span>
              </p>
              <p className="text-zinc-400">
                Avg sleep:{" "}
                <span className="text-zinc-100 font-semibold">
                  {weeklySummary.avgSleep
                    ? `${weeklySummary.avgSleep.toFixed(
                        1
                      )} hrs`
                    : "—"}
                </span>
              </p>
              <p className="text-zinc-400">
                Avg hydration:{" "}
                <span className="text-zinc-100 font-semibold">
                  {weeklySummary.avgHydration
                    ? `${weeklySummary.avgHydration.toFixed(
                        1
                      )} L`
                    : "—"}
                </span>
              </p>
              <p className="text-zinc-400">
                Smoothie days:{" "}
                <span className="text-emerald-400 font-semibold">
                  {weeklySummary.smoothieDays}
                </span>
              </p>
              <p className="text-zinc-400">
                Workout days:{" "}
                <span className="text-emerald-400 font-semibold">
                  {weeklySummary.workoutDays}
                </span>
              </p>
            </div>
          )}
        </section>

        {/* Today’s Ops */}
        <section className="md:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-300">
              Today&apos;s Ops
            </h2>
            <span className="text-xs text-zinc-500">
              {openTasks.length} open tasks
            </span>
          </div>
          <ul className="space-y-2 text-sm">
            {openTasks.map((task, index) => (
              <li
                key={index}
                className="flex items-center justify-between rounded-xl bg-zinc-800/80 px-3 py-2"
              >
                <span>{task}</span>
                <span className="text-[10px] uppercase tracking-wide text-zinc-400">
                  pending
                </span>
              </li>
            ))}
            {openTasks.length === 0 && (
              <li className="text-xs text-emerald-400">
                All core ops complete. Nice work.
              </li>
            )}
          </ul>
        </section>
      </div>

      {/* Message of the Day */}
      <div className="mt-6 grid">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-300 mb-2">
              Message of the Day
            </h2>
            <p className="text-sm text-zinc-100 leading-relaxed">
              “{quote}”
            </p>
          </div>
          <p className="mt-3 text-[11px] text-zinc-500">
            Mission: show up for Future You.
          </p>
        </section>
      </div>
    </div>
  );
}
