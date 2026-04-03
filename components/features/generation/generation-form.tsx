"use client";

import { useState } from "react";
import { Image as ImageIcon, VideoCamera as VideoIcon, MagicWand as Wand2 } from "@phosphor-icons/react/dist/ssr";
import { ModelPicker } from "./model-picker";
import { getModelCreditCost, getModelInfo } from "@/lib/ai/models";
import { Spinner } from "@/components/ui/spinner";
import TextareaAutosize from "react-textarea-autosize";

export interface ApiInfo {
  model: string;
  modelName: string;
  provider: string;
  generationTimeMs: number;
  estimatedCostUSD: number | null;
  pricingLabel?: string;
  usage?: unknown;
}

export interface DirectResult {
  url: string;
  type: string;
  apiInfo: ApiInfo;
}

interface GenerationFormProps {
  userTier: "free" | "pro" | "max";
  imageBalance: number;
  videoBalance: number;
  isWhitelisted?: boolean;
  onJobCreated: (jobId: string, prompt: string, type: string) => void;
  onDirectResult?: (result: DirectResult, prompt: string, type: string) => void;
}

type GenerationType = "image" | "video";

const DEFAULT_MODELS: Record<GenerationType, string> = {
  image: "dall-e-3",
  video: "kling_video",
};

const MAX_PROMPT_LENGTH = 500;

export function GenerationForm({
  userTier,
  imageBalance,
  videoBalance,
  isWhitelisted = false,
  onJobCreated,
  onDirectResult,
}: GenerationFormProps) {
  const [type, setType] = useState<GenerationType>("image");
  const [prompt, setPrompt] = useState("");
  const [modelId, setModelId] = useState(DEFAULT_MODELS.image);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creditCost = modelId ? getModelCreditCost(modelId) : 0;
  const selectedModel = modelId ? getModelInfo(modelId) : null;
  const balance = type === "image" ? imageBalance : videoBalance;
  const canAfford = balance >= creditCost;
  const promptValid = prompt.trim().length >= 3;
  const canSubmit = canAfford && promptValid && !isSubmitting;

  function handleTypeChange(newType: GenerationType) {
    if (newType === type) return;
    setType(newType);
    setModelId(DEFAULT_MODELS[newType]);
    setError(null);
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), modelId, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Generation failed. Please try again.");
        return;
      }

      // Direct generation: result returned immediately (whitelisted users)
      if (data.status === "completed" && data.url) {
        onDirectResult?.({ url: data.url, type: data.type, apiInfo: data.apiInfo }, prompt.trim(), type);
        setPrompt("");
        return;
      }

      // Queued generation: normal pipeline
      onJobCreated(data.jobId as string, prompt.trim(), type);
      setPrompt("");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const promptErrorId = "prompt-error";
  const promptDescId = "prompt-desc";

  const V  = "var(--color-primary)";
  const VL = "var(--color-secondary)";

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Generate AI content" style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      
      {/* Prompt Input */}
      <div style={{ position: "relative" }}>
        <TextareaAutosize
          id="prompt"
          name="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
          aria-required="true"
          aria-describedby={`${promptDescId}${error ? ` ${promptErrorId}` : ""}`}
          aria-invalid={error ? "true" : "false"}
          maxLength={MAX_PROMPT_LENGTH}
          minRows={2}
          maxRows={6}
          placeholder={
            type === "image"
              ? "A cinematic portrait of a futuristic AI influencer..."
              : "A viral dance trend video with neon lighting..."
          }
          className="dash-input"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSubmit) handleSubmit();
            }
          }}
          style={{
            width: "100%",
            resize: "none",
            borderRadius: "1rem",
            border: "none",
            background: "transparent",
            padding: "0 0 1rem 0",
            fontSize: "1rem",
            color: "#fff",
            lineHeight: 1.5,
            boxSizing: "border-box",
            outline: "none",
          }}
        />
      </div>

      {error && (
        <p
          id={promptErrorId}
          role="alert"
          style={{ marginBottom: "12px", fontSize: "0.875rem", color: "#f87171", display: "flex", alignItems: "center", gap: "6px" }}
        >
          {error}
        </p>
      )}

      {/* Constraints and Cost */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
          <span aria-live="polite" style={{ fontVariantNumeric: "tabular-nums" }}>
            {prompt.length}/{MAX_PROMPT_LENGTH}
          </span>
        </div>
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
          Cost:{" "}
          <span style={{ fontWeight: 700, color: VL }}>
            {creditCost} {type} credit{creditCost !== 1 ? "s" : ""}
          </span>
          {!canAfford && (
            <span style={{ marginLeft: "8px", color: "#f87171", fontWeight: 600 }}>Insufficient</span>
          )}
        </p>
      </div>

      {/* Bottom Tool Strip */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", position: "relative" }}>
        
        {/* Left Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Type toggles */}
          <div
            role="group"
            aria-label="Content type"
            style={{
              display: "flex",
              gap: "4px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "999px",
              padding: "4px",
            }}
          >
            {(["image", "video"] as GenerationType[]).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={type === t}
                onClick={() => handleTypeChange(t)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "999px",
                  fontSize: "0.75rem", fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.1s, color 0.1s",
                  background: type === t ? "rgba(255,255,255,0.15)" : "transparent",
                  color: type === t ? "#fff" : "rgba(255,255,255,0.45)",
                }}
              >
                {t === "image" ? <ImageIcon size={14} aria-hidden /> : <VideoIcon size={14} aria-hidden />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Model Picker Trigger / Popover wrapped component */}
          <div>
            <ModelPicker
              type={type}
              value={modelId}
              onChange={setModelId}
              userTier={userTier}
              isWhitelisted={isWhitelisted}
            />
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="submit"
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
          className="dash-generate-btn"
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: V,
            color: "var(--color-primary-text)",
            border: "none",
            borderRadius: "999px",
            padding: "10px 24px",
            fontSize: "0.875rem", fontWeight: 700,
            cursor: canSubmit ? "pointer" : "not-allowed",
            boxShadow: canSubmit ? `0 0 24px ${V}66` : "none",
          }}
        >
          {isSubmitting ? (
            <Spinner size={14} label="Generating..." />
          ) : (
            <Wand2 size={14} aria-hidden />
          )}
          {isSubmitting ? "Generating..." : "Generate"}
        </button>
      </div>
    </form>
  );
}


