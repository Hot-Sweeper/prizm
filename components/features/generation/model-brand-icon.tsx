import type { ModelInfo } from "@/lib/ai/models";

interface ModelBrandIconProps {
  model: ModelInfo;
  active?: boolean;
}

function BrandGlyph({ familyKey }: { familyKey: ModelInfo["familyKey"] }) {
  switch (familyKey) {
    case "openai":
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
          <path fill="currentColor" d="M12 3.2 8.6 5.1 6 9.4v5.2l3.3 1.9 2.7-1.6-2.6-1.5-1.3.8-1.7-1V10l1.7-3 1.6-.9 1.7 1-.1 3.2 2.4 1.4 2.6-1.5V7.3L12 3.2Zm4.1 2.4v3.1L18 9.8l1.7 3v1.9L18 15.8l-2.9-1.7v-2.7L12.7 10l-.1 4.3 4 2.3 3.4-2v-3.8l-2-3.5-1.9-1.7Z"/>
        </svg>
      );
    case "google":
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
          <path fill="currentColor" d="m12 2.8 2.1 5.1 5.1 2.1-5.1 2.1-2.1 5.1-2.1-5.1-5.1-2.1 5.1-2.1L12 2.8Zm6.2 12.1 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z"/>
        </svg>
      );
    case "xai":
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
          <path fill="currentColor" d="M6.3 5h3.1l2.7 4.2L14.9 5H18l-4.3 6.3L18 19h-3.1l-2.8-4.5L9.2 19H6l4.4-7.7L6.3 5Z"/>
        </svg>
      );
    case "flux":
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
          <path fill="currentColor" d="M6 5h11v3H9.8v2.7h5.6v3H9.8V19H6V5Zm9.4 8.4L18 19h-3.5l-2.5-5.6h3.4Z"/>
        </svg>
      );
    case "ideogram":
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
          <path fill="currentColor" d="M4 4h6v6H4V4Zm10 0h6v2h-6V4Zm0 4h6v2h-6V8ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"/>
        </svg>
      );
    case "recraft":
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
          <path fill="currentColor" d="M6 5h7.8c2.6 0 4.2 1.4 4.2 3.7 0 1.8-1.1 3.1-2.9 3.5L18.5 19h-3.2l-3-6H9v6H6V5Zm3 2.6v3h4.1c1.2 0 1.9-.5 1.9-1.6s-.7-1.4-1.9-1.4H9Z"/>
        </svg>
      );
    case "stability":
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
          <path fill="currentColor" d="M12 4.4a7.6 7.6 0 1 0 0 15.2 7.6 7.6 0 0 0 0-15.2Zm0 2.3a5.3 5.3 0 1 1 0 10.6 5.3 5.3 0 0 1 0-10.6Zm0 2a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Z"/>
        </svg>
      );
    case "kling":
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
          <path fill="currentColor" d="M5 4h3v7l6-7h3.8l-6.6 7 7 9H14.6L9.8 13.6V20H5V4Z"/>
        </svg>
      );
    case "luma":
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
          <path fill="currentColor" d="M14.7 4.5c-4.7 0-8.2 3.3-8.2 7.7 0 3.9 2.8 6.9 6.8 7.3-2.8-1-4.6-3.3-4.6-6.3 0-3.7 3.1-6.6 7-6.6 1.1 0 2 .1 2.8.4-1-.9-2.2-1.5-3.8-1.5Z"/>
        </svg>
      );
    case "runway":
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
          <path fill="currentColor" d="M5 18 9.5 6h3L8 18H5Zm6 0L15.5 6h3L14 18h-3Z"/>
        </svg>
      );
    case "minimax":
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
          <path fill="currentColor" d="M5 18V6h2.6L12 12l4.4-6H19v12h-3v-6.9L12.8 15h-1.6L8 11.1V18H5Z"/>
        </svg>
      );
    case "wan":
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
          <path fill="currentColor" d="M4.5 6h2.8l1.8 8 2-5.8h2l2 5.8 1.8-8h2.6L17 18h-2.5L12 11.7 9.6 18H7L4.5 6Z"/>
        </svg>
      );
  }
}

export function ModelBrandIcon({ model, active = false }: ModelBrandIconProps) {
  return (
    <span
      aria-hidden
      style={{
        width: "1.6rem",
        height: "1.6rem",
        borderRadius: "0.55rem",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? "var(--color-secondary)" : "rgba(255,255,255,0.72)",
        background: active ? "color-mix(in srgb, var(--color-primary) 16%, transparent)" : "rgba(255,255,255,0.04)",
        border: active ? "1px solid color-mix(in srgb, var(--color-secondary) 40%, transparent)" : "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}
    >
      <BrandGlyph familyKey={model.familyKey} />
    </span>
  );
}