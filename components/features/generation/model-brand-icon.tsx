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
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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
  const iconUrl = model.iconUrl ?? model.brandIconUrl;

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
      {iconUrl ? (
        <img
          src={iconUrl}
          alt=""
          width={14}
          height={14}
          style={{ width: "14px", height: "14px", objectFit: "contain" }}
        />
      ) : (
        <BrandGlyph familyKey={model.familyKey} />
      )}
    </span>
  );
}