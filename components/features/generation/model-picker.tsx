"use client";

import { Lock } from "@phosphor-icons/react/dist/ssr";
import { IMAGE_MODELS, VIDEO_MODELS } from "@/lib/ai/models";

type GenerationType = "image" | "video";

interface ModelPickerProps {
  type: GenerationType;
  value: string;
  onChange: (modelId: string) => void;
  userTier: "free" | "pro" | "max";
}

const TIER_ORDER = { free: 0, pro: 1, max: 2 };

export function ModelPicker({ type, value, onChange, userTier }: ModelPickerProps) {
  const models = type === "image" ? IMAGE_MODELS : VIDEO_MODELS;

  // Normalize to a flat structure — avoids union-of-const-objects `never` typing
  type ModelEntry = {
    id: string;
    displayName: string;
    creditCost: number;
    minTier: "free" | "pro" | "max";
    description: string;
  };
  type ModelValue = Omit<ModelEntry, "id">;
  const entries: ModelEntry[] = (Object.entries(models) as [string, ModelValue][]).map(
    ([id, m]) => ({ id, ...m }),
  );

  return (
    <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
      <legend style={{ marginBottom: "8px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
        Select model
      </legend>
      <div
        role="radiogroup"
        aria-label="Select generation model"
        style={{ display: "flex", flexDirection: "column", gap: "8px" }}
      >
        {entries.map((model) => {
          const { id } = model;
          const locked = TIER_ORDER[model.minTier] > TIER_ORDER[userTier];
          const checked = value === id;

          const V  = "var(--color-primary)";
          const VL = "var(--color-secondary)";

          return (
            <label
              key={id}
              data-disabled={locked ? "true" : undefined}
              className={`model-radio-card${checked ? " model-radio-selected" : ""}`}
              title={locked ? `Requires ${model.minTier} plan` : undefined}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderRadius: "0.875rem",
                border: checked
                  ? "1px solid rgba(167,139,250,0.55)"
                  : "1px solid rgba(255,255,255,0.08)",
                background: checked
                  ? "rgba(124,58,237,0.12)"
                  : "rgba(255,255,255,0.025)",
                padding: "12px 16px",
                cursor: locked ? "not-allowed" : "pointer",
                opacity: locked ? 0.45 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Custom radio dot */}
                <div
                  aria-hidden
                  style={{
                    width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0,
                    border: checked ? `5px solid ${V}` : "2px solid rgba(255,255,255,0.2)",
                    background: checked ? "#fff" : "transparent",
                    boxShadow: checked ? `0 0 8px ${V}88` : "none",
                    transition: "border 0.15s, box-shadow 0.15s",
                  }}
                />
                <input
                  type="radio"
                  name="model"
                  value={id}
                  checked={checked}
                  disabled={locked}
                  onChange={() => !locked && onChange(id)}
                  className="sr-only"
                  aria-label={`${model.displayName}${locked ? ` (requires ${model.minTier} plan)` : ""}`}
                />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>
                    {model.displayName}
                    {locked && <Lock size={11} aria-hidden style={{ color: "rgba(255,255,255,0.3)" }} />}
                  </div>
                  <p style={{ fontSize: "0.775rem", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>{model.description}</p>
                </div>
              </div>

              {/* Tier badge + cost */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px", flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: "0.625rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
                    color: checked ? VL : "rgba(255,255,255,0.3)",
                    background: checked ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.06)",
                    padding: "2px 8px", borderRadius: "999px",
                  }}
                >
                  {model.minTier}
                </span>
                <span
                  style={{ fontSize: "0.8125rem", fontWeight: 700, color: checked ? VL : "rgba(255,255,255,0.4)" }}
                  aria-label={`${model.creditCost} credit${model.creditCost !== 1 ? "s" : ""}`}
                >
                  {model.creditCost} cr
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}


