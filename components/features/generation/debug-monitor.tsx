"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type DebugLevel = "info" | "warn" | "error";

type DebugEvent = {
  id: number;
  time: string;
  level: DebugLevel;
  source: string;
  message: string;
  details?: string;
};

interface DebugMonitorProps {
  activeJobCount: number;
  historyCount: number;
}

const MAX_EVENTS = 200;
const STORAGE_KEY = "prizm.debug.monitor";
const HEARTBEAT_INTERVAL_MS = 1000;
const JANK_THRESHOLD_MS = 500;
const REQUEST_WARN_MS = 2000;

function nowIso() {
  return new Date().toISOString();
}

function stringifyDetails(value: unknown) {
  try {
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  } catch {
    return "[unserializable details]";
  }
}

function isMonitorEnabledFromUrl() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("debugMonitor") === "1";
}

export function DebugMonitor({ activeJobCount, historyCount }: DebugMonitorProps) {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(true);
  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [lastTick, setLastTick] = useState(nowIso());
  const idRef = useRef(0);

  const pushEvent = useCallback((event: Omit<DebugEvent, "id" | "time">) => {
    const next: DebugEvent = {
      id: ++idRef.current,
      time: nowIso(),
      ...event,
    };

    setEvents((prev) => {
      const merged = [next, ...prev];
      return merged.slice(0, MAX_EVENTS);
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedEnabled = window.localStorage.getItem(STORAGE_KEY) === "1";
    const urlEnabled = isMonitorEnabledFromUrl();
    const initialEnabled = savedEnabled || urlEnabled;
    setEnabled(initialEnabled);
    if (urlEnabled) {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
    pushEvent({
      level: "info",
      source: "monitor",
      message: enabled ? "debug monitor enabled" : "debug monitor disabled",
    });
  }, [enabled, pushEvent]);

  useEffect(() => {
    if (!enabled) return;

    const onError = (event: ErrorEvent) => {
      pushEvent({
        level: "error",
        source: "window.error",
        message: event.message || "uncaught runtime error",
        details: stringifyDetails({ file: event.filename, line: event.lineno, column: event.colno }),
      });
    };

    const onUnhandled = (event: PromiseRejectionEvent) => {
      pushEvent({
        level: "error",
        source: "unhandledrejection",
        message: "unhandled promise rejection",
        details: stringifyDetails(event.reason),
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandled);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandled);
    };
  }, [enabled, pushEvent]);

  useEffect(() => {
    if (!enabled) return;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const started = performance.now();
      const method = (init?.method || "GET").toUpperCase();
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      try {
        const response = await originalFetch(input, init);
        const durationMs = Math.round(performance.now() - started);

        pushEvent({
          level: !response.ok || durationMs >= REQUEST_WARN_MS ? "warn" : "info",
          source: "fetch",
          message: `${method} ${url} -> ${response.status} (${durationMs}ms)`,
        });

        return response;
      } catch (error) {
        const durationMs = Math.round(performance.now() - started);
        pushEvent({
          level: "error",
          source: "fetch",
          message: `${method} ${url} -> failed (${durationMs}ms)`,
          details: stringifyDetails(error),
        });
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [enabled, pushEvent]);

  useEffect(() => {
    if (!enabled || typeof PerformanceObserver === "undefined") return;

    let observer: PerformanceObserver | null = null;

    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          pushEvent({
            level: "warn",
            source: "longtask",
            message: `main thread blocked for ${Math.round(entry.duration)}ms`,
            details: stringifyDetails({ name: entry.name, start: Math.round(entry.startTime) }),
          });
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch {
      pushEvent({
        level: "warn",
        source: "longtask",
        message: "longtask observer unavailable in this browser",
      });
    }

    return () => {
      observer?.disconnect();
    };
  }, [enabled, pushEvent]);

  useEffect(() => {
    if (!enabled) return;

    let last = performance.now();
    const intervalId = window.setInterval(() => {
      const current = performance.now();
      const drift = current - last - HEARTBEAT_INTERVAL_MS;
      last = current;
      setLastTick(nowIso());

      if (drift > JANK_THRESHOLD_MS) {
        pushEvent({
          level: "warn",
          source: "heartbeat",
          message: `event loop lag detected (${Math.round(drift)}ms drift)`,
        });
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, pushEvent]);

  useEffect(() => {
    if (!enabled) return;

    const onOnline = () => pushEvent({ level: "info", source: "network", message: "browser is online" });
    const onOffline = () => pushEvent({ level: "warn", source: "network", message: "browser is offline" });
    const onVisibility = () =>
      pushEvent({
        level: "info",
        source: "visibility",
        message: `document visibility: ${document.visibilityState}`,
      });

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, pushEvent]);

  const runProbes = useCallback(async () => {
    const probe = async (label: string, url: string) => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 6000);
      const started = performance.now();

      try {
        const res = await fetch(url, { cache: "no-store", credentials: "include", signal: controller.signal });
        const body = await res.text().catch(() => "");
        const durationMs = Math.round(performance.now() - started);
        pushEvent({
          level: res.ok ? "info" : "warn",
          source: "probe",
          message: `${label} ${res.status} (${durationMs}ms)`,
          details: body.slice(0, 180),
        });
      } catch (error) {
        const durationMs = Math.round(performance.now() - started);
        pushEvent({
          level: "error",
          source: "probe",
          message: `${label} failed (${durationMs}ms)`,
          details: stringifyDetails(error),
        });
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    await probe("auth session", "/api/auth/session");
    await probe("credit balance", "/api/credits/balance");
  }, [pushEvent]);

  const counters = useMemo(() => {
    let info = 0;
    let warn = 0;
    let error = 0;
    for (const event of events) {
      if (event.level === "info") info += 1;
      else if (event.level === "warn") warn += 1;
      else error += 1;
    }
    return { info, warn, error };
  }, [events]);

  if (!enabled) {
    return (
      <button
        type="button"
        onClick={() => setEnabled(true)}
        style={{
          position: "fixed",
          right: "1rem",
          bottom: "1rem",
          zIndex: 2000,
          padding: "0.5rem 0.75rem",
          borderRadius: "0.75rem",
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(15,15,15,0.85)",
          color: "#fff",
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.04em",
          cursor: "pointer",
        }}
      >
        Open Debug Monitor
      </button>
    );
  }

  return (
    <aside
      aria-label="Debug monitor"
      style={{
        position: "fixed",
        right: "1rem",
        bottom: "1rem",
        width: open ? "min(92vw, 460px)" : "auto",
        maxHeight: open ? "70vh" : "none",
        zIndex: 2000,
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: "0.9rem",
        background: "rgba(12,12,12,0.95)",
        color: "#fff",
        overflow: "hidden",
        boxShadow: "0 16px 36px rgba(0,0,0,0.55)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          padding: "0.6rem 0.7rem",
          borderBottom: open ? "1px solid rgba(255,255,255,0.12)" : "none",
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <strong style={{ fontSize: "0.78rem", letterSpacing: "0.04em" }}>PRIZM Debug Monitor</strong>
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              borderRadius: "0.5rem",
              padding: "0.25rem 0.45rem",
              fontSize: "0.7rem",
              cursor: "pointer",
            }}
          >
            {open ? "Minimize" : "Expand"}
          </button>
          <button
            type="button"
            onClick={() => setEnabled(false)}
            style={{
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              borderRadius: "0.5rem",
              padding: "0.25rem 0.45rem",
              fontSize: "0.7rem",
              cursor: "pointer",
            }}
          >
            Disable
          </button>
        </div>
      </header>

      {open && (
        <div style={{ padding: "0.7rem", display: "grid", gap: "0.6rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.45rem" }}>
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.55rem", padding: "0.45rem" }}>
              <div style={{ fontSize: "0.67rem", opacity: 0.75 }}>Active Jobs</div>
              <div style={{ fontSize: "0.92rem", fontWeight: 700 }}>{activeJobCount}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.55rem", padding: "0.45rem" }}>
              <div style={{ fontSize: "0.67rem", opacity: 0.75 }}>History</div>
              <div style={{ fontSize: "0.92rem", fontWeight: 700 }}>{historyCount}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.55rem", padding: "0.45rem" }}>
              <div style={{ fontSize: "0.67rem", opacity: 0.75 }}>Last Tick</div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {lastTick}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={runProbes}
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                borderRadius: "0.5rem",
                padding: "0.33rem 0.5rem",
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              Run Probes
            </button>
            <button
              type="button"
              onClick={() => setEvents([])}
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                borderRadius: "0.5rem",
                padding: "0.33rem 0.5rem",
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const text = events
                  .slice()
                  .reverse()
                  .map((event) => `[${event.time}] ${event.level.toUpperCase()} ${event.source}: ${event.message}${event.details ? ` | ${event.details}` : ""}`)
                  .join("\n");
                void navigator.clipboard.writeText(text);
              }}
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                borderRadius: "0.5rem",
                padding: "0.33rem 0.5rem",
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              Copy Logs
            </button>
            <span style={{ marginLeft: "auto", fontSize: "0.72rem", opacity: 0.85 }}>
              info {counters.info} | warn {counters.warn} | error {counters.error}
            </span>
          </div>

          <div
            role="log"
            aria-live="polite"
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "0.6rem",
              background: "rgba(0,0,0,0.35)",
              padding: "0.35rem",
              maxHeight: "38vh",
              overflow: "auto",
              display: "grid",
              gap: "0.3rem",
            }}
          >
            {events.length === 0 && (
              <p style={{ margin: 0, padding: "0.4rem", fontSize: "0.74rem", opacity: 0.75 }}>
                No events yet.
              </p>
            )}
            {events.map((event) => (
              <div
                key={event.id}
                style={{
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "0.4rem",
                  background:
                    event.level === "error"
                      ? "rgba(220,38,38,0.16)"
                      : event.level === "warn"
                        ? "rgba(245,158,11,0.16)"
                        : "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ fontSize: "0.66rem", opacity: 0.85, display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                  <span>{event.source}</span>
                  <span>{event.time}</span>
                </div>
                <div style={{ fontSize: "0.76rem", marginTop: "0.2rem", lineHeight: 1.35 }}>{event.message}</div>
                {event.details && (
                  <pre
                    style={{
                      margin: "0.35rem 0 0",
                      fontSize: "0.66rem",
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      opacity: 0.9,
                    }}
                  >
                    {event.details}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
