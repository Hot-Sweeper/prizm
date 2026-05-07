"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Image as ImageIcon, VideoCamera as VideoIcon, MagicWand as Wand2, Paperclip, X as XIcon } from "@phosphor-icons/react/dist/ssr";
import { ModelPicker } from "./model-picker";
import { AspectRatioPicker } from "./aspect-ratio-picker";
import { ResolutionPicker } from "./resolution-picker";
import { getModelCreditCost, getModelInfo } from "@/lib/ai/models";
import { Spinner } from "@/components/ui/spinner";
import TextareaAutosize from "react-textarea-autosize";
import NextImage from "next/image";

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
  jobId: string | null;
  url: string;
  type: string;
  apiInfo: ApiInfo;
}

interface GenerationFormProps {
  userTier: "free" | "pro" | "max";
  imageBalance: number;
  videoBalance: number;
  isWhitelisted?: boolean;
  onJobCreated: (jobId: string, prompt: string, type: string, modelId: string) => void;
  onDirectResult?: (result: DirectResult, prompt: string, type: string) => void;
}

type GenerationType = "image" | "video";

interface AttachedImage {
  id: string;
  file: File;
  previewUrl: string;
}

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGES = 5;

const DEFAULT_MODELS: Record<GenerationType, string> = {
  image: "dall-e-3",
  video: "kling_video",
};

const MAX_PROMPT_LENGTH = 500;
const GENERATE_REQUEST_TIMEOUT_MS = 15000;

function createTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timeoutId) };
}

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
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("2K");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);


  const creditCost = modelId ? getModelCreditCost(modelId) : 0;
  const selectedModel = modelId ? getModelInfo(modelId) : null;
  const balance = type === "image" ? imageBalance : videoBalance;
  const canAfford = balance >= creditCost;
  const promptValid = prompt.trim().length >= 3;
  const canSubmit = canAfford && promptValid && !isSubmitting;

  const addImages = useCallback((files: File[]) => {
    const validFiles = files.filter((f) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(f.type)) return false;
      if (f.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) return false;
      return true;
    });

    if (validFiles.length === 0) {
      setError("Only PNG, JPEG, WebP, and GIF images under 10 MB are supported.");
      return;
    }

    setAttachedImages((prev) => {
      const remaining = MAX_IMAGES - prev.length;
      if (remaining <= 0) {
        setError(`Maximum ${MAX_IMAGES} images allowed.`);
        return prev;
      }
      const toAdd = validFiles.slice(0, remaining);
      const newAttachments: AttachedImage[] = toAdd.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      return [...prev, ...newAttachments];
    });
    setError(null);
  }, []);

  function removeImage(id: string) {
    setAttachedImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) addImages(files);
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter((item) => item.type.startsWith("image/"));
    if (imageItems.length === 0) return;

    e.preventDefault();
    const files = imageItems.map((item) => item.getAsFile()).filter(Boolean) as File[];
    if (files.length > 0) addImages(files);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) addImages(files);
    e.target.value = "";
  }

  function clearAttachedImages() {
    attachedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setAttachedImages([]);
  }

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
      let imageData: string[] | undefined;
      if (attachedImages.length > 0) {
        imageData = await Promise.all(
          attachedImages.map(
            (img) =>
              new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error("Failed to read image"));
                reader.readAsDataURL(img.file);
              })
          )
        );
      }

      const timeout = createTimeoutSignal(GENERATE_REQUEST_TIMEOUT_MS);
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: timeout.signal,
        body: JSON.stringify({
          prompt: prompt.trim(),
          modelId,
          type,
          settings: { aspectRatio, resolution },
          ...(imageData && { referenceImages: imageData }),
        }),
      });
      timeout.clear();

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Generation failed. Please try again.");
        return;
      }

      // Direct generation: result returned immediately (whitelisted users)
      if (data.status === "completed" && data.url) {
        onDirectResult?.({ jobId: data.jobId ?? null, url: data.url, type: data.type, apiInfo: data.apiInfo }, prompt.trim(), type);
        setPrompt("");
        clearAttachedImages();
        return;
      }

      // Queued generation: normal pipeline
      onJobCreated(data.jobId as string, prompt.trim(), type, modelId);
      setPrompt("");
      clearAttachedImages();
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setError("Request timed out. Please try again.");
          return;
        }
      setError("Request timed out or failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const promptErrorId = "prompt-error";
  const promptDescId = "prompt-desc";

  const V  = "var(--color-primary)";
  const VL = "var(--color-secondary)";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Generate AI content"
      style={{ display: "flex", flexDirection: "column", gap: "0", position: "relative" }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drop zone overlay */}
      {isDragging && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            borderRadius: "1.5rem",
            border: `2px dashed ${VL}`,
            background: "rgba(124,58,237,0.1)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            <ImageIcon size={28} weight="duotone" style={{ color: VL }} aria-hidden />
            <span style={{ color: VL, fontSize: "0.875rem", fontWeight: 600, letterSpacing: "0.03em" }}>
              Drop images here
            </span>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        multiple
        onChange={handleFileInput}
        style={{ display: "none" }}
        aria-hidden="true"
        tabIndex={-1}
      />
      
      {/* Prompt Input */}
      <div style={{ position: "relative" }}>
        <TextareaAutosize
          id="prompt"
          name="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onPaste={handlePaste}
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
          className="prompt-textarea"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSubmit) handleSubmit();
            }
          }}
          style={{
            width: "100%",
            resize: "none",
            borderRadius: "0",
            border: "none",
            background: "transparent",
            padding: "0 0 1rem 0",
            fontSize: "1rem",
            color: "#fff",
            lineHeight: 1.5,
            boxSizing: "border-box",
            outline: "none",
            caretColor: "var(--color-secondary)",
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

      {/* Attached Image Previews */}
      {attachedImages.length > 0 && (
        <div
          role="list"
          aria-label="Attached reference images"
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "12px",
            overflowX: "auto",
            paddingBottom: "4px",
          }}
        >
          {attachedImages.map((img) => (
            <div
              key={img.id}
              role="listitem"
              style={{
                position: "relative",
                width: "56px",
                height: "56px",
                flexShrink: 0,
                borderRadius: "0.75rem",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <NextImage
                src={img.previewUrl}
                alt={img.file.name}
                fill
                style={{ objectFit: "cover" }}
                unoptimized
              />
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                aria-label={`Remove ${img.file.name}`}
                style={{
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.7)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  padding: 0,
                }}
              >
                <XIcon size={10} weight="bold" aria-hidden />
              </button>
            </div>
          ))}
          {attachedImages.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Add more images"
              style={{
                width: "56px",
                height: "56px",
                flexShrink: 0,
                borderRadius: "0.75rem",
                border: "1px dashed rgba(255,255,255,0.15)",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.3)",
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                e.currentTarget.style.color = "rgba(255,255,255,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                e.currentTarget.style.color = "rgba(255,255,255,0.3)";
              }}
            >
              <Paperclip size={16} aria-hidden />
            </button>
          )}
        </div>
      )}

      {/* Bottom Tool Strip */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", position: "relative" }}>
        
        {/* Left Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload reference images"
            title="Upload images"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "0.5rem",
              border: "1px solid rgba(255,255,255,0.1)",
              background: attachedImages.length > 0 ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)",
              color: attachedImages.length > 0 ? VL : "rgba(255,255,255,0.45)",
              cursor: "pointer",
              transition: "all 0.15s",
              padding: 0,
              position: "relative",
            }}
          >
            <Paperclip size={15} aria-hidden />
            {attachedImages.length > 0 && (
              <span
                aria-label={`${attachedImages.length} image${attachedImages.length > 1 ? "s" : ""} attached`}
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: VL,
                  color: "#fff",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                {attachedImages.length}
              </span>
            )}
          </button>

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

          {/* Settings Pickers */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ModelPicker
              type={type}
              value={modelId}
              onChange={setModelId}
              userTier={userTier}
              isWhitelisted={isWhitelisted}
            />
            {type === "image" && (
              <>
                <AspectRatioPicker
                  value={aspectRatio}
                  onChange={setAspectRatio}
                />
                {(modelId.includes("nano") || modelId.includes("banana") || modelId.includes("gemini")) && (
                  <ResolutionPicker
                    value={resolution}
                    onChange={setResolution}
                  />
                )}
              </>
            )}
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


