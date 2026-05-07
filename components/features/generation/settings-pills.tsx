"use client";

import { useState, useRef, useEffect } from "react";
import { CaretUp } from "@phosphor-icons/react/dist/ssr";
import type { ModelCapabilityProfile, ModelSettingField } from "@/lib/ai/model-capabilities";

interface SettingsPillsProps {
  profile: ModelCapabilityProfile | null;
  settings: Record<string, unknown>;
  onChange: (key: string, value: string | number | boolean) => void;
}

// Show a tiny rectangle matching the aspect ratio
function AspectPreview({ ratio, color }: { ratio: string; color: string }) {
  const parts = ratio.replace("x", ":").split(":").map(Number);
  const w = parts[0] || 1;
  const h = parts[1] || 1;
  const maxDim = 12;
  const isLandscape = w >= h;
  const calcW = isLandscape ? maxDim : Math.max(4, Math.round((w / h) * maxDim));
  const calcH = isLandscape ? Math.max(4, Math.round((h / w) * maxDim)) : maxDim;
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "16px",
        height: "16px",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: "block",
          width: `${calcW}px`,
          height: `${calcH}px`,
          border: `1.5px solid ${color}`,
          borderRadius: "2px",
        }}
      />
    </span>
  );
}

function PillDropdown({
  field,
  value,
  onChange,
}: {
  field: ModelSettingField;
  value: unknown;
  onChange: (key: string, value: string | number | boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeOption = field.options?.find((opt) => opt.value === String(value));
  const isAspectRatio = field.key === "aspectRatio" || field.key === "size" && field.options?.some((opt) => opt.value.includes(":"));
  const activeColor = "rgba(255,255,255,0.5)";
  const selectedColor = "var(--color-secondary)";

  useEffect(() => {
    if (!isOpen) return;
    function close(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [isOpen]);

  const looksLikeRatio = (v: string) => /^\d+[x:]\d+$/.test(v);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={`${field.label}: ${activeOption?.label ?? String(value)}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "999px",
          padding: "8px 12px",
          color: "#fff",
          cursor: "pointer",
          fontSize: "0.75rem",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {isAspectRatio && looksLikeRatio(String(value)) ? (
          <AspectPreview ratio={String(value)} color={activeColor} />
        ) : null}
        <span>{activeOption?.label ?? String(value)}</span>
        <CaretUp
          size={11}
          weight="bold"
          style={{
            color: "rgba(255,255,255,0.35)",
            transform: isOpen ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={field.label}
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: 0,
            background: "rgba(10,10,10,0.97)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "1rem",
            padding: "6px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
            zIndex: 110,
            backdropFilter: "blur(20px)",
            minWidth: "140px",
          }}
        >
          {field.options?.map((opt) => {
            const selected = String(value) === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(field.key, opt.value);
                  setIsOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  borderRadius: "0.5rem",
                  background: selected ? "rgba(124,58,237,0.12)" : "transparent",
                  color: selected ? selectedColor : "#fff",
                  border: selected ? "1px solid rgba(167,139,250,0.55)" : "1px solid transparent",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  whiteSpace: "nowrap",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (!selected) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  if (!selected) e.currentTarget.style.background = "transparent";
                }}
              >
                {isAspectRatio && looksLikeRatio(opt.value) ? (
                  <AspectPreview
                    ratio={opt.value}
                    color={selected ? selectedColor : "rgba(255,255,255,0.5)"}
                  />
                ) : (
                  <span style={{ width: "16px", display: "inline-block" }} />
                )}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SettingsPills({ profile, settings, onChange }: SettingsPillsProps) {
  if (!profile || profile.fields.length === 0) return null;

  // Only show select fields as pills (not toggle or number — those stay in an overflow)
  const pillFields = profile.fields.filter((field) => field.input === "select");

  if (pillFields.length === 0) return null;

  return (
    <>
      {pillFields.map((field) => (
        <PillDropdown
          key={field.key}
          field={field}
          value={settings[field.key] ?? field.defaultValue}
          onChange={onChange}
        />
      ))}
    </>
  );
}
