"use client";

import React, { useEffect, useState } from "react";

export default function ThemeWrapper({ children }) {
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lifeOS_currentProfile");
      if (saved) {
        const parsed = JSON.parse(saved);
        setProfileName(parsed.name || "");
      }
    } catch {}
  }, []);

  const isMichelle = profileName === "Michelle";

  return (
    <div
      className={
        isMichelle
          ? "bg-pink-50 text-pink-900 min-h-screen"
          : "bg-zinc-950 text-zinc-100 min-h-screen"
      }
    >
      {children}
    </div>
  );
}
