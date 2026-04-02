"use client";

import { Spinner as Loader2 } from "@phosphor-icons/react/dist/ssr";

interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

export function Spinner({ size = 20, className = "", label = "Loading..." }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <Loader2
        size={size}
        aria-hidden="true"
        style={{ animation: "spin 1s linear infinite" }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}


