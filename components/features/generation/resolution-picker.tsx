"use client";

import { useState, useRef, useEffect } from "react";
import { CaretUp, MonitorPlay } from "@phosphor-icons/react/dist/ssr";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const RESOLUTIONS = ["1K", "2K", "4K"];

export function ResolutionPicker({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "999px", padding: "8px 12px", color: "#fff", cursor: "pointer",
          transition: "background 0.15s",
        }}
      >
        <MonitorPlay size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
        <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{value}</span>
        <CaretUp size={12} weight="bold" style={{ color: "rgba(255,255,255,0.4)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {isOpen && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: 0,
          background: "rgba(10,10,10,0.95)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "1rem", padding: "6px", display: "flex", flexDirection: "column", gap: "2px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.8)", zIndex: 100, backdropFilter: "blur(20px)"
        }}>
          {RESOLUTIONS.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => { onChange(r); setIsOpen(false); }}
              style={{
                width: "100%", padding: "6px 16px", borderRadius: "0.5rem",
                background: value === r ? "rgba(124,58,237,0.12)" : "transparent",
                color: value === r ? "var(--color-secondary)" : "#fff",
                border: value === r ? "1px solid rgba(167,139,250,0.55)" : "1px solid transparent",
                cursor: "pointer", fontSize: "0.75rem", fontWeight: 600,
                textAlign: "left", whiteSpace: "nowrap"
              }}
              onMouseEnter={(e) => { if (value !== r) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={(e) => { if (value !== r) e.currentTarget.style.background = "transparent"; }}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}