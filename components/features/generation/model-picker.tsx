"use client";

import { Lock } from "@phosphor-icons/react/dist/ssr";
import { getProviderGroups } from "@/lib/ai/models";
import { ModelBrandIcon } from "./model-brand-icon";

type GenerationType = "image" | "video";

interface ModelPickerProps {
  type: GenerationType;
  value: string;
  onChange: (modelId: string) => void;
  userTier: "free" | "pro" | "max";
  isWhitelisted?: boolean;
}

const TIER_ORDER = { free: 0, pro: 1, max: 2 };

export function ModelPicker({ type, value, onChange, userTier, isWhitelisted = false }: ModelPickerProps) {
  const groups = getProviderGroups(type);

  return (
    <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
      <legend style={{ marginBottom: "8px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
        Select model
      </legend>
      <div
        role="radiogroup"
        aria-label="Select generation model"
        className="model-picker-scrollbar"
        style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "340px", overflowY: "auto", paddingRight: "6px" }}
      >
        {Object.entries(groups).map(([provider, models]) => (
          <div key={provider}>
            <div style={{
              fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.2)", padding: "6px 4px 4px", marginTop: "2px",
            }}>
              {provider}
            </div>
            {models.map(({ id, info: model }) => {
              const locked = TIER_ORDER[model.minTier] > TIER_ORDER[userTier] || (!!model.directOnly && !isWhitelisted);
              const checked = value === id;
              const V = "var(--color-primary)";
              const VL = "var(--color-secondary)";
              const unavailableReason = model.directOnly && !isWhitelisted
                ? "Available in direct test mode for whitelisted users"
                : `Requires ${model.minTier} plan`;

              return (
                <label
                  key={id}
                  data-disabled={locked ? "true" : undefined}
                  className={`model-radio-card${checked ? " model-radio-selected" : ""}`}
                  title={locked ? unavailableReason : undefined}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    borderRadius: "0.75rem",
                    border: checked ? "1px solid rgba(167,139,250,0.55)" : "1px solid rgba(255,255,255,0.06)",
                    background: checked ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.02)",
                    padding: "8px 12px",
                    cursor: locked ? "not-allowed" : "pointer",
                    opacity: locked ? 0.4 : 1,
                    marginBottom: "4px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    <div
                      aria-hidden
                      style={{
                        width: "14px", height: "14px", borderRadius: "50%", flexShrink: 0,
                        border: checked ? `4px solid ${V}` : "2px solid rgba(255,255,255,0.15)",
                        background: checked ? "#fff" : "transparent",
                        boxShadow: checked ? `0 0 6px ${V}88` : "none",
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
                      aria-label={`${model.displayName}${locked ? ` (${unavailableReason.toLowerCase()})` : ""}`}
                    />
                    <ModelBrandIcon model={model} active={checked} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 600, color: "#fff" }}>
                        {model.displayName}
                        {locked && <Lock size={10} aria-hidden style={{ color: "rgba(255,255,255,0.3)" }} />}
                        {model.directOnly && isWhitelisted && (
                          <span
                            style={{
                              fontSize: "0.55rem",
                              fontWeight: 800,
                              letterSpacing: "0.12em",
                              textTransform: "uppercase",
                              color: VL,
                              background: "rgba(255,255,255,0.06)",
                              padding: "1px 5px",
                              borderRadius: "999px",
                            }}
                          >
                            Direct
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "0.675rem", color: "rgba(255,255,255,0.3)", marginTop: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {model.description}
                      </p>
                      <p style={{ fontSize: "0.625rem", color: checked ? VL : "rgba(255,255,255,0.46)", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontVariantNumeric: "tabular-nums" }}>
                        API {model.pricingLabel}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0, marginLeft: "8px" }}>
                    <span
                      style={{
                        fontSize: "0.575rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
                        color: checked ? VL : "rgba(255,255,255,0.25)",
                        background: checked ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.05)",
                        padding: "1px 6px", borderRadius: "999px",
                      }}
                    >
                      {model.minTier}
                    </span>
                    <span
                      style={{ fontSize: "0.725rem", fontWeight: 700, color: checked ? VL : "rgba(255,255,255,0.35)" }}
                      aria-label={`${model.creditCost} credit${model.creditCost !== 1 ? "s" : ""}`}
                    >
                      {model.creditCost} cr
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        ))}
      </div>
    </fieldset>
  );
}


