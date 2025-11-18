// app/api/epaper-summary/route.ts
export const runtime = "edge"; // optional, but nice + fast

const LAT = 53.8;    // Roughly Mayo/Westport-ish
const LON = -9.5;
const TIMEZONE = "Europe/Dublin";

type LifeOsTask = {
  title: string;
  priority?: string;
};

type LifeOsReminder = {
  title: string;
  dueDate?: string;
};

type LifeOsEvent = {
  title: string;
  time?: string;
};

type WeatherPayload = {
  temp: number;
  tempMin: number;
  tempMax: number;
  windKph: number;
  desc: string;
};

async function fetchWeather(): Promise<WeatherPayload | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${LAT}&longitude=${LON}` +
      `&current_weather=true` +
      `&daily=temperature_2m_max,temperature_2m_min` +
      `&timezone=${encodeURIComponent(TIMEZONE)}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Weather fetch failed");

    const data = await res.json();

    const current = data.current_weather;
    const daily = data.daily;

    const temp = typeof current?.temperature === "number"
      ? Math.round(current.temperature)
      : 0;

    const windKph = typeof current?.windspeed === "number"
      ? Math.round(current.windspeed)
      : 0;

    const tempMax = Array.isArray(daily?.temperature_2m_max)
      ? Math.round(daily.temperature_2m_max[0])
      : temp;

    const tempMin = Array.isArray(daily?.temperature_2m_min)
      ? Math.round(daily.temperature_2m_min[0])
      : temp;

    const code = current?.weathercode ?? 0;
    const desc = mapWeatherCodeToDescription(code);

    return {
      temp,
      tempMin,
      tempMax,
      windKph,
      desc,
    };
  } catch (err) {
    console.error("Weather error", err);
    return null;
  }
}

// Simple mapping for Open-Meteo weather codes
function mapWeatherCodeToDescription(code: number): string {
  if ([0].includes(code)) return "Clear";
  if ([1, 2].includes(code)) return "Partly cloudy";
  if ([3].includes(code)) return "Overcast";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55].includes(code)) return "Drizzle";
  if ([61, 63, 65].includes(code)) return "Rain";
  if ([71, 73, 75].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Showers";
  if ([95, 96, 99].includes(code)) return "Thunder";
  return "Cloudy";
}

function formatDateTime() {
  const now = new Date();

  const dateFormatter = new Intl.DateTimeFormat("en-IE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TIMEZONE,
  });

  const timeFormatter = new Intl.DateTimeFormat("en-IE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIMEZONE,
  });

  return {
    date: dateFormatter.format(now), // e.g. "Tue, 18 Nov 2025"
    time: timeFormatter.format(now), // e.g. "08:37"
  };
}

export async function GET() {
  const { date, time } = formatDateTime();

  // --- Static Tasks/Reminders/Events for now ---
  const tasks: LifeOsTask[] = [
    { title: "Treadmill – 20 mins", priority: "Normal" },
    { title: "Order materials", priority: "High" },
    { title: "Weekly food shop" },
  ];

  const reminders: LifeOsReminder[] = [
    { title: "Bins out – General waste", dueDate: "Tue" },
    { title: "School note for Luke", dueDate: "Today" },
  ];

  const events: LifeOsEvent[] = [
    // leave empty if you want "No events today" on the display
    // { title: "CP Clinic", time: "14:00" },
  ];

  // --- Weather (live, but optional) ---
  const weather = await fetchWeather();

  const payload = {
    profile: "Will",
    date,               // string
    time,               // string
    quote:
      "Discipline is doing what needs to be done, even when you don’t feel like it.",

    // extra summary stats your ESP32 already reads
    openOrders: 0,
    todayTaskCount: tasks.length,

    tasks,
    reminders,
    events,

    // what your firmware now expects:
    weather: weather
      ? {
          temp: weather.temp,
          tempMin: weather.tempMin,
          tempMax: weather.tempMax,
          windKph: weather.windKph,
          desc: weather.desc,
        }
      : undefined,
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // avoid caching so the epaper always gets fresh-ish data
      "Cache-Control": "no-store",
    },
  });
}
