import { NextResponse } from "next/server";

export async function GET() {
  // TEMP: hardcoded demo data – just to prove we can drive the ePaper.
  // Later we’ll replace this with real data from a DB or sync.
  const payload = {
    profile: "Will",
    date: new Date().toISOString().slice(0, 10),
    quote:
      "Discipline is doing what needs to be done, even when you don’t feel like it.",
    openOrders: 3,
    todayTaskCount: 2,
    tasks: [
      {
        title: "Treadmill 20 mins",
        dueDate: "",
        priority: "Normal",
        assignedTo: "Will",
      },
      {
        title: "Order materials",
        dueDate: "",
        priority: "High",
        assignedTo: "Will",
      },
    ],
    reminders: [
      {
        title: "Bins out – general waste",
        dueDate: "2025-11-17",
        assignedTo: "",
      },
      {
        title: "School note for Luke",
        dueDate: "2025-11-17",
        assignedTo: "Michelle",
      },
    ],
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=60", // okay to cache for 1 min
    },
  });
}
