"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  name: string;
  pin?: string; // optional 4-digit PIN, not real security
  createdAt: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [pinInput, setPinInput] = useState("");
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");

  // Load existing profiles from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("lifeOS_profiles");
      if (saved) {
        const parsed: Profile[] = JSON.parse(saved);
        parsed.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
        setProfiles(parsed);
        if (parsed.length > 0) {
          setSelectedProfileId(parsed[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load profiles", err);
    }
  }, []);

  const saveProfiles = (list: Profile[]) => {
    setProfiles(list);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("lifeOS_profiles", JSON.stringify(list));
      }
    } catch (err) {
      console.error("Failed to save profiles", err);
    }
  };

  const createProfile = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      alert("Profile name is required.");
      return;
    }
    if (newPin && !/^\d{4}$/.test(newPin)) {
      alert("PIN must be 4 digits (or leave it blank).");
      return;
    }
    const now = new Date().toISOString();
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const profile: Profile = {
      id,
      name: trimmed,
      pin: newPin || undefined,
      createdAt: now,
    };
    const updated = [...profiles, profile];
    saveProfiles(updated);
    setNewName("");
    setNewPin("");
    setSelectedProfileId(id);
    setPinInput("");
    // Also log straight into the new profile
    setCurrentProfile(profile);
  };

  const setCurrentProfile = (profile: Profile) => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "lifeOS_currentProfile",
          JSON.stringify({
            id: profile.id,
            name: profile.name,
          })
        );
      }
    } catch (err) {
      console.error("Failed to set current profile", err);
    }
    router.push("/");
  };

  const handleLogin = () => {
    if (!selectedProfileId) {
      alert("Select a profile or create a new one.");
      return;
    }
    const profile = profiles.find((p) => p.id === selectedProfileId);
    if (!profile) {
      alert("Profile not found.");
      return;
    }
    if (profile.pin) {
      // PIN protected
      if (pinInput !== profile.pin) {
        alert("Incorrect PIN.");
        return;
      }
    }
    setCurrentProfile(profile);
  };

  const currentProfilesCount = profiles.length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 md:p-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h1 className="text-xl font-bold">
            Select profile
          </h1>
          <p className="text-xs text-zinc-400">
            This isn&apos;t secure login, just a simple way to switch between
            profiles (e.g. Will, Partner, Kids) and lay the groundwork for real auth later.
          </p>

          {currentProfilesCount === 0 ? (
            <p className="text-xs text-amber-300 mt-2">
              No profiles yet. Create one on the right to get started.
            </p>
          ) : (
            <>
              <label className="block text-xs text-zinc-400 mt-2">
                Existing profiles
              </label>
              <select
                value={selectedProfileId}
                onChange={(e) => {
                  setSelectedProfileId(e.target.value);
                  setPinInput("");
                }}
                className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs text-zinc-100"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.pin ? " (PIN)" : ""}
                  </option>
                ))}
              </select>

              {profiles.find((p) => p.id === selectedProfileId)?.pin && (
                <div className="mt-2 space-y-1">
                  <label className="block text-xs text-zinc-400">
                    PIN (4 digits)
                  </label>
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    maxLength={4}
                    className="w-32 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs text-zinc-100"
                    inputMode="numeric"
                  />
                </div>
              )}

              <button
                onClick={handleLogin}
                className="mt-3 text-xs px-3 py-2 rounded-full border border-emerald-500 bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-100 transition"
              >
                Log into profile
              </button>
            </>
          )}

          <a
            href="/"
            className="inline-block mt-4 text-[11px] text-zinc-500 hover:text-zinc-300"
          >
            ⬅ Back to dashboard (no profile)
          </a>
        </div>

        <div className="space-y-3 border-t border-zinc-800 pt-4 md:border-t-0 md:border-l md:pl-4 md:pt-0">
          <h2 className="text-sm font-semibold text-zinc-200">
            Create new profile
          </h2>
          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-zinc-400">Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs text-zinc-100"
                placeholder="e.g. Will, Partner, Family, Workshop"
              />
            </div>
            <div>
              <label className="block text-zinc-400">
                PIN (optional, 4 digits)
              </label>
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                maxLength={4}
                inputMode="numeric"
                className="w-32 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs text-zinc-100"
                placeholder="e.g. 1234"
              />
              <p className="mt-1 text-[10px] text-zinc-500">
                This is just for light protection on this device. It&apos;s not
                secure like a real password system.
              </p>
            </div>
          </div>
          <button
            onClick={createProfile}
            className="text-xs px-3 py-2 rounded-full border border-sky-500 bg-sky-900/40 hover:bg-sky-800/60 text-sky-100 transition"
          >
            + Create profile
          </button>
        </div>
      </div>
    </div>
  );
}
