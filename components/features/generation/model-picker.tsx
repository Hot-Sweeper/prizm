"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Lock, CaretUp, Cpu } from "@phosphor-icons/react/dist/ssr";
import { getProviderGroups, getModelInfo } from "@/lib/ai/models";
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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const groups = getProviderGroups(type);
  const activeModelInfo = value ? getModelInfo(value) : null;
  const groupEntries = useMemo(() => Object.entries(groups), [groups]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "999px",
          padding: "8px 14px",
          color: "#fff",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
      >
        <Cpu size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
        <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>
          {activeModelInfo?.displayName || "Select Model"}
        </span>
        <CaretUp size={12} weight="bold" style={{ color: "rgba(255,255,255,0.4)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select generation model"
          className="model-picker-scrollbar"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)", // pop UP from the bottom bar
            left: 0,
            width: "320px",
            maxHeight: "360px",
            overflowY: "auto",
            background: "rgba(10,10,10,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "1rem",
            padding: "8px",
            display: "flex", flexDirection: "column", gap: "6px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
            zIndex: 100,
          }}
        >
          {groupEntries.map(([provider, models]) => (
            <div key={provider}>
              <div style={{
                fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.2)", padding: "6px 8px 4px", marginTop: "2px",
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
                  <button
                    key={id}
                    type="button"
                    role="option"
                    aria-selected={checked}
                    data-disabled={locked ? "true" : undefined}
                    title={locked ? unavailableReason : undefined}
                    onClick={() => {
                      if (!locked) {
                        onChange(id);
                        setIsOpen(false);
                      }
                    }}
                    style={{
                      width: "100%",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      borderRadius: "0.5rem",
                      border: checked ? "1px solid rgba(167,139,250,0.55)" : "1px solid transparent",
                      background: checked ? "rgba(124,58,237,0.12)" : "transparent",
                      padding: "8px",
                      cursor: locked ? "not-allowed" : "pointer",
                      opacity: locked ? 0.4 : 1,
                      marginBottom: "2px",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => { if (!checked && !locked) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { if (!checked && !locked) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
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
                        <p style={{ fontSize: "0.625rem", color: checked ? VL : "rgba(255,255,255,0.46)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontVariantNumeric: "tabular-nums" }}>
                          API {model.pricingLabel}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0, marginLeft: "8px" }}>
                      <span
                        style={{ fontSize: "0.725rem", fontWeight: 700, color: checked ? VL : "rgba(255,255,255,0.35)" }}
                      >
                        {model.creditCost} cr
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


