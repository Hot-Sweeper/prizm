"use client";

import { useState } from "react";
import { Image as ImageIcon, VideoCamera as VideoIcon, MagicWand as Wand2 } from "@phosphor-icons/react/dist/ssr";
import { ModelPicker } from "./model-picker";
import { getModelCreditCost } from "@/lib/ai/models";
import { Spinner } from "@/components/ui/spinner";

interface GenerationFormProps {
  userTier: "free" | "pro" | "max";
  imageBalance: number;
  videoBalance: number;
  onJobCreated: (jobId: string) => void;
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
  onJobCreated,
}: GenerationFormProps) {
  const [type, setType] = useState<GenerationType>("image");
  const [prompt, setPrompt] = useState("");
  const [modelId, setModelId] = useState(DEFAULT_MODELS.image);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creditCost = modelId ? getModelCreditCost(modelId) : 0;
  const balance = type === "image" ? imageBalance : videoBalance;
  const canAfford = balance >= creditCost;
  const promptValid = prompt.trim().length >= 3;
  const canSubmit = canAfford && promptValid && !isSubmitting;

  function handleTypeChange(newType: GenerationType) {
    setType(newType);
    setModelId(DEFAULT_MODELS[newType]);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

      setPrompt("");
      onJobCreated(data.jobId as string);
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
    <form onSubmit={handleSubmit} noValidate aria-label="Generate AI content" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Type toggle — pill style */}
      <div
        role="group"
        aria-label="Content type"
        style={{
          display: "flex",
          gap: "6px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
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
              flex: 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
              padding: "9px 20px",
              borderRadius: "999px",
              fontSize: "0.875rem", fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "background 0.18s, color 0.18s, box-shadow 0.18s",
              background: type === t ? V : "transparent",
              color: type === t ? "#fff" : "rgba(255,255,255,0.45)",
              boxShadow: type === t ? `0 0 20px ${V}55` : "none",
            }}
          >
            {t === "image" ? <ImageIcon size={15} aria-hidden /> : <VideoIcon size={15} aria-hidden />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Prompt */}
      <div>
        <label
          htmlFor="prompt"
          style={{ display: "block", marginBottom: "6px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}
        >
          Prompt <span aria-hidden style={{ color: "#f87171", fontWeight: 400 }}>*</span>
        </label>
        <textarea
          id="prompt"
          name="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
          aria-required="true"
          aria-describedby={`${promptDescId}${error ? ` ${promptErrorId}` : ""}`}
          aria-invalid={error ? "true" : "false"}
          maxLength={MAX_PROMPT_LENGTH}
          rows={4}
          placeholder={
            type === "image"
              ? "A cinematic portrait of a futuristic AI influencer..."
              : "A viral dance trend video with neon lighting..."
          }
          className="dash-input"
          style={{
            width: "100%",
            resize: "none",
            borderRadius: "0.875rem",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            padding: "14px 16px",
            fontSize: "0.9375rem",
            color: "#fff",
            lineHeight: 1.65,
            boxSizing: "border-box",
          }}
        />
        <div
          id={promptDescId}
          style={{ marginTop: "6px", display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "rgba(255,255,255,0.25)" }}
        >
          <span>Describe what you want to create</span>
          <span aria-live="polite" style={{ fontVariantNumeric: "tabular-nums" }}>
            {prompt.length}/{MAX_PROMPT_LENGTH}
          </span>
        </div>
        {error && (
          <p
            id={promptErrorId}
            role="alert"
            style={{ marginTop: "8px", fontSize: "0.875rem", color: "#f87171", display: "flex", alignItems: "center", gap: "6px" }}
          >
            {error}
          </p>
        )}
      </div>

      {/* Model picker */}
      <ModelPicker
        type={type}
        value={modelId}
        onChange={setModelId}
        userTier={userTier}
      />

      {/* Credit preview + submit */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", paddingTop: "0.25rem" }}>
        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
          Cost:{" "}
          <span style={{ fontWeight: 700, color: VL }}>
            {creditCost} {type} credit{creditCost !== 1 ? "s" : ""}
          </span>
          {!canAfford && (
            <span style={{ marginLeft: "8px", color: "#f87171", fontWeight: 600 }}>Insufficient credits</span>
          )}
        </p>

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
            padding: "12px 28px",
            fontSize: "0.9375rem", fontWeight: 700,
            cursor: canSubmit ? "pointer" : "not-allowed",
            boxShadow: canSubmit ? `0 0 28px ${V}55` : "none",
          }}
        >
          {isSubmitting ? (
            <Spinner size={15} label="Generating..." />
          ) : (
            <Wand2 size={15} aria-hidden />
          )}
          {isSubmitting ? "Queuing..." : "Generate"}
        </button>
      </div>
    </form>
  );
}


