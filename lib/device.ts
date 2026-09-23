"use client";

const COUPLE_KEY = "tonight:couple_id";
const ROLE_PREFIX = "tonight:role:"; // + session id -> "a" | "b"

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // private browsing / blocked storage — session still works, just won't
    // resume across visits on this device.
  }
}

export function getCoupleId(): string | null {
  return safeGet(COUPLE_KEY);
}

export function setCoupleId(id: string) {
  safeSet(COUPLE_KEY, id);
}

export function getRole(sessionId: string): "a" | "b" | null {
  const v = safeGet(ROLE_PREFIX + sessionId);
  return v === "a" || v === "b" ? v : null;
}

export function setRole(sessionId: string, role: "a" | "b") {
  safeSet(ROLE_PREFIX + sessionId, role);
}
