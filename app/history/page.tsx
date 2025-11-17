"use client";

import React, { useEffect, useState } from "react";

type HistoryEntry = {
  date: string;
  weightKg: string;
  sleepHours: string;
  mood: string;
  hydrationLitres: string;
  smoothieDone: boolean;
  workoutDone: boolean;
  savedAt?: string;
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const saved = window.localStorage.getItem("lifeOS_history");
      if (saved) {
        const parsed: HistoryEntry[] = JSON.parse(saved);
        // sort oldest → newest for chart use
        parsed.sort((a, b) => (a.date > b.date ? 1 : -1));
        setHistory(parsed);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    }
  }, []);

  // Prepare data for weight chart
  const weightPoints = history
    .map((entry) => ({
      date: entry.date,
      weight: parseFloat(entry.weightKg || "0"),
    }))
    .filter((p) => !Number.isNaN(p.weight));

  const hasChartData = weightPoints.length >= 2;

  // 7-day rolling average (really “last 7 entries”)
  const rollingPoints = hasChartData
    ? weightPoints.map((_, idx) => {
        const start = Math.max(0, idx - 6); // up to 7 points
        const slice = weightPoints.slice(start, idx + 1);
        const sum = slice.reduce((acc, p) => acc + p.weight, 0);
        const avg = sum / slice.length;
        return { date: weightPoints[idx].date, avg };
      })
    : [];

  let minWeight = 0;
  let maxWeight = 0;
  if (hasChartData) {
    const allValues = [
      ...weightPoints.map((p) => p.weight),
      ...rollingPoints.map((p) => p.avg),
    ];
    minWeight = allValues.reduce(
      (min, v) => (v < min ? v : min),
      allValues[0]
    );
    maxWeight = allValues.reduce(
      (max, v) => (v > max ? v : max),
      allValues[0]
    );
    const padding = (maxWeight - minWeight || 1) * 0.1;
    minWeight -= padding;
    maxWeight += padding;
  }

  const width = 600;
  const height = 200;
  const paddingX = 20;
  const paddingY = 20;

  const getX = (index: number) => {
    if (weightPoints.length === 1) return width / 2;
    const step = (width - paddingX * 2) / (weightPoints.length - 1);
    return paddingX + step * index;
  };

  const getY = (weight: number) => {
    if (maxWeight === minWeight) return height / 2;
    const ratio = (weight - minWeight) / (maxWeight - minWeight); // 0–1
    return height - paddingY - ratio * (height - paddingY * 2);
  };

  const polylinePoints = hasChartData
    ? weightPoints
        .map((p, index) => `${getX(index)},${getY(p.weight)}`)
        .join(" ")
    : "";

  const rollingPolylinePoints =
    hasChartData && rollingPoints.length
      ? rollingPoints
          .map((p, index) => `${getX(index)},${getY(p.avg)}`)
          .join(" ")
      : "";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">History</h1>
          <p className="text-sm text-zinc-400">
            Logged days from your Life OS.
          </p>
        </div>
        <a
          href="/"
          className="text-xs px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition"
        >
          ⬅ Back to dashboard
        </a>
      </header>

      {/* Weight trend chart */}
      <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
        <h2 className="text-sm font-semibold text-zinc-300 mb-2">
          Weight trend (with 7-day rolling average)
        </h2>
        {!hasChartData ? (
          <p className="text-sm text-zinc-400">
            Not enough data yet. Save at least two days with a weight value to
            see the trend.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full max-w-full"
            >
              {/* Background */}
              <rect
                x={0}
                y={0}
                width={width}
                height={height}
                fill="#09090b"
                rx={12}
              />
              {/* Mid grid line */}
              <line
                x1={paddingX}
                y1={height / 2}
                x2={width - paddingX}
                y2={height / 2}
                stroke="#27272a"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              {/* Raw weight line */}
              <polyline
                fill="none"
                stroke="#22c55e"
                strokeWidth={2}
                points={polylinePoints}
              />
              {/* Raw points */}
              {weightPoints.map((p, index) => (
                <circle
                  key={`${p.date}-${index}`}
                  cx={getX(index)}
                  cy={getY(p.weight)}
                  r={3}
                  fill="#22c55e"
                />
              ))}
              {/* Rolling average line */}
              {rollingPolylinePoints && (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  points={rollingPolylinePoints}
                />
              )}
              {/* Labels */}
              <text
                x={paddingX}
                y={paddingY}
                fill="#a1a1aa"
                fontSize="10"
                textAnchor="start"
              >
                Max: {maxWeight.toFixed(1)} kg
              </text>
              <text
                x={paddingX}
                y={height - paddingY / 2}
                fill="#a1a1aa"
                fontSize="10"
                textAnchor="start"
              >
                Min: {minWeight.toFixed(1)} kg
              </text>
              {/* Legend */}
              <text
                x={width - paddingX}
                y={paddingY}
                fill="#22c55e"
                fontSize="10"
                textAnchor="end"
              >
                Daily weight
              </text>
              <text
                x={width - paddingX}
                y={paddingY + 12}
                fill="#38bdf8"
                fontSize="10"
                textAnchor="end"
              >
                7-day avg
              </text>
            </svg>
            <p className="mt-2 text-xs text-zinc-500">
              Green = daily weight. Blue dashed = 7-day rolling average (smooth
              trend).
            </p>
          </div>
        )}
      </section>

      {/* Table of entries */}
      {history.length === 0 ? (
        <p className="text-sm text-zinc-400">
          No history yet. Go back to the dashboard, fill in today, and click
          &quot;Save today to history&quot;.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/70">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-900/90 text-zinc-300 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Weight (kg)</th>
                <th className="px-3 py-2 text-left">Sleep</th>
                <th className="px-3 py-2 text-left">Mood</th>
                <th className="px-3 py-2 text-left">Hydration (L)</th>
                <th className="px-3 py-2 text-left">Smoothie</th>
                <th className="px-3 py-2 text-left">Workout</th>
              </tr>
            </thead>
            <tbody>
              {history
                .slice()
                .sort((a, b) => (a.date < b.date ? 1 : -1)) // newest first for table
                .map((entry, idx) => (
                  <tr
                    key={idx}
                    className={
                      idx % 2 === 0 ? "bg-zinc-900/40" : "bg-zinc-900/70"
                    }
                  >
                    <td className="px-3 py-2 align-top">{entry.date}</td>
                    <td className="px-3 py-2 align-top">
                      {entry.weightKg || "-"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {entry.sleepHours || "-"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {entry.mood || "-"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {entry.hydrationLitres || "-"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {entry.smoothieDone ? "✅" : "⬜"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {entry.workoutDone ? "✅" : "⬜"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
