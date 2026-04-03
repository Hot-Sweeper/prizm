"use client";

import { Image as ImageIcon, VideoCamera as VideoIcon, WarningCircle as AlertCircle } from "@phosphor-icons/react/dist/ssr";

interface CreditDisplayProps {
  imageBalance: number;
  videoBalance: number;
}

const VL = "var(--color-secondary)";
const UNLIMITED_BALANCE_THRESHOLD = 999_999;

function isUnlimitedBalance(balance: number): boolean {
  return balance >= UNLIMITED_BALANCE_THRESHOLD;
}

function formatBalance(balance: number): string {
  return isUnlimitedBalance(balance) ? "∞" : balance.toString();
}

export function CreditDisplay({ imageBalance, videoBalance }: CreditDisplayProps) {
  const unlimitedImage = isUnlimitedBalance(imageBalance);
  const unlimitedVideo = isUnlimitedBalance(videoBalance);
  const lowImage = !unlimitedImage && imageBalance < 5;
  const lowVideo = !unlimitedVideo && videoBalance < 3;

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: "0.625rem",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "999px",
        padding: "5px 14px",
        fontSize: "0.8125rem",
      }}
      aria-label="Credit balances"
    >
      {/* Images */}
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <ImageIcon size={13} aria-hidden style={{ color: VL }} />
        <span style={{ color: "rgba(255,255,255,0.38)" }}>Img</span>
        <span
          style={{
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: lowImage ? "#fbbf24" : "#fff",
          }}
          aria-label={unlimitedImage ? "Unlimited image credits" : `${imageBalance} image credits`}
        >
          {formatBalance(imageBalance)}
        </span>
        {lowImage && <AlertCircle size={11} aria-label="Low image credits" style={{ color: "#fbbf24" }} />}
      </div>

      <div style={{ width: "1px", height: "14px", background: "rgba(255,255,255,0.1)" }} aria-hidden />

      {/* Videos */}
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <VideoIcon size={13} aria-hidden style={{ color: VL }} />
        <span style={{ color: "rgba(255,255,255,0.38)" }}>Vid</span>
        <span
          style={{
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: lowVideo ? "#fbbf24" : "#fff",
          }}
          aria-label={unlimitedVideo ? "Unlimited video credits" : `${videoBalance} video credits`}
        >
          {formatBalance(videoBalance)}
        </span>
        {lowVideo && <AlertCircle size={11} aria-label="Low video credits" style={{ color: "#fbbf24" }} />}
      </div>
    </div>
  );
}


