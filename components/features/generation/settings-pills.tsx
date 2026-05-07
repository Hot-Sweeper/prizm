"use client";

import { useState, useRef, useEffect } from "react";
import { CaretUp } from "@phosphor-icons/react/dist/ssr";
import type { ModelCapabilityProfile, ModelSettingField } from "@/lib/ai/model-capabilities";

interface SettingsPillsProps {
  profile: ModelCapabilityProfile | null;
  settings: Record<string, unknown>;
  onChange: (key: string, value: string | number | boolean) => void;
}

// Matches "1:1", "16:9", "1024x1024", "1792x1024" etc.
const looksLikeRatio = (v: string) => /^\d+[x:]\d+$/.test(v);

// Returns true if this field should render shape previews
function isShapeField(field: ModelSettingField): boolean {
  if (field.key === "aspectRatio") return true;
  // size field when options contain ratio-like values (colon or "x" separated)
  if (field.key === "size" && field.options?.some((opt) => looksLikeRatio(opt.value))) return true;
  return false;
}

// Draws a proportional solid rectangle for the given ratio/resolution string
function AspectPreview({
  ratio,
  active,
}: {
  ratio: string;
  active: boolean;
}) {
  const parts = ratio.replace("x", ":").split(":").map(Number);
  const w = parts[0] || 1;
  const h = parts[1] || 1;
  const maxDim = 13;
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
        width: "18px",
        height: "18px",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: "block",
          width: `${calcW}px`,
          height: `${calcH}px`,
          background: active ? "var(--color-secondary)" : "rgba(255,255,255,0.55)",
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
  const showShape = isShapeField(field);
  const selectedColor = "var(--color-secondary)";

  useEffect(() => {
    if (!isOpen) return;
    function close(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [isOpen]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={`${field.label}: ${activeOption?.label ?? String(value)}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "999px",
          padding: "9px 14px",
          color: "#fff",
          cursor: "pointer",
          fontSize: "0.8rem",
          fontWeight: 600,
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}
      >
        {showShape && looksLikeRatio(String(value)) && (
          <AspectPreview ratio={String(value)} active={false} />
        )}
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
            minWidth: "160px",
          }}
        >
          {field.options?.map((opt) => {
            const selected = String(value) === opt.value;
            const optHasShape = showShape && looksLikeRatio(opt.value);
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
                  padding: "7px 12px",
                  borderRadius: "0.5rem",
                  background: selected ? "rgba(124,58,237,0.12)" : "transparent",
                  color: selected ? selectedColor : "#fff",
                  border: selected ? "1px solid rgba(167,139,250,0.55)" : "1px solid transparent",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  whiteSpace: "nowrap",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (!selected) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  if (!selected) e.currentTarget.style.background = "transparent";
                }}
              >
                {optHasShape ? (
                  <AspectPreview ratio={opt.value} active={selected} />
                ) : (
                  // Reserve space so text aligns when some rows have shapes and some don't
                  showShape && <span style={{ width: "18px", display: "inline-block" }} />
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
