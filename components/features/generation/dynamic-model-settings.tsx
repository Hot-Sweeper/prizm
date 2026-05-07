"use client";

import type { ModelCapabilityProfile } from "@/lib/ai/model-capabilities";

interface DynamicModelSettingsProps {
  profile: ModelCapabilityProfile | null;
  settings: Record<string, unknown>;
  onChange: (key: string, value: string | number | boolean) => void;
}

export function DynamicModelSettings({ profile, settings, onChange }: DynamicModelSettingsProps) {
  if (!profile || profile.fields.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="Model settings"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "0.75rem",
        marginBottom: "1rem",
      }}
    >
      {profile.fields.map((field) => {
        const value = settings[field.key] ?? field.defaultValue;

        return (
          <label
            key={field.key}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.375rem",
            }}
          >
            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
              {field.label}
            </span>

            {field.input === "select" ? (
              <select
                value={String(value)}
                onChange={(event) => onChange(field.key, event.target.value)}
                style={{
                  appearance: "none",
                  borderRadius: "0.85rem",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#fff",
                  minHeight: "42px",
                  padding: "0 0.85rem",
                }}
              >
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : null}

            {field.input === "number" ? (
              <input
                type="number"
                min={field.min}
                max={field.max}
                step={field.step ?? 1}
                value={Number(value)}
                onChange={(event) => onChange(field.key, Number(event.target.value))}
                style={{
                  borderRadius: "0.85rem",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#fff",
                  minHeight: "42px",
                  padding: "0 0.85rem",
                }}
              />
            ) : null}

            {field.input === "text" ? (
              <input
                type="text"
                value={String(value)}
                placeholder={field.placeholder}
                onChange={(event) => onChange(field.key, event.target.value)}
                style={{
                  borderRadius: "0.85rem",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#fff",
                  minHeight: "42px",
                  padding: "0 0.85rem",
                }}
              />
            ) : null}

            {field.input === "toggle" ? (
              <button
                type="button"
                aria-pressed={Boolean(value)}
                onClick={() => onChange(field.key, !Boolean(value))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: "0.85rem",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: Boolean(value) ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.04)",
                  color: "#fff",
                  minHeight: "42px",
                  padding: "0 0.85rem",
                  cursor: "pointer",
                }}
              >
                <span>{Boolean(value) ? "On" : "Off"}</span>
                <span style={{ color: Boolean(value) ? "var(--color-secondary)" : "rgba(255,255,255,0.45)" }}>
                  {field.label}
                </span>
              </button>
            ) : null}
          </label>
        );
      })}
    </div>
  );
}