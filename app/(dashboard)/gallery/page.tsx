import { GalleryPageClient } from "./gallery-page-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery — PRIZM",
  description: "Your AI-generated images and videos",
};

export default function GalleryPage() {
  return <GalleryPageClient />;
}
