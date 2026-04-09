"""
Portrait Generator — Nano Banana 2 (gemini-3.1-flash-image-preview)
Sends reference photos to CometAPI's Gemini endpoint and generates
a high-quality portrait of the subject.
"""

import base64
import os
import sys
import json
from pathlib import Path
from datetime import datetime

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

try:
    from PIL import Image
except ImportError:
    Image = None

COMET_BASE_URL = "https://api.cometapi.com"
MODEL_ID = "gemini-3.1-flash-image-preview"
ASPECT_RATIO = "3:4"  # portrait orientation
MAX_REFERENCE_IMAGES = 6  # Gemini input limit safety margin
MAX_IMAGE_SIZE_PX = 1536  # downscale large images to keep payload reasonable

PORTRAIT_PROMPT = (
    "Using the reference photos of this person, create a stunning high-quality "
    "portrait photograph. FACE ACCURACY IS CRITICAL: You must perfectly match the "
    "exact facial geometry, eye shape, nose, mouth proportions, and jawline of the "
    "person in the reference photos. Do not alter their identity or make them look generic. "
    "The person is 18 years old — preserve their youthful face, do NOT age them up. "
    "The scene is a beautiful, sunny beach. The person is wearing a cute, stylish, and flattering beach outfit (like a beautiful summer dress or elegant beachwear). "
    "IMPORTANT: The person has hair that fades from brown at the roots to blonde at the ends. "
    "Show this natural brown-to-blonde fade clearly. "
    "The portrait should show the face and upper body in a natural, cute, and relaxed pose. "
    "Bright, beautiful sunlight, white sand, and ocean waves softly blurred in the background. "
    "Ultra-sharp focus on the eyes, natural skin texture, photorealistic quality."
)


def load_api_key() -> str:
    if load_dotenv:
        env_local = Path(__file__).resolve().parent.parent / ".env.local"
        if env_local.exists():
            load_dotenv(env_local)
        else:
            load_dotenv()

    key = os.environ.get("COMETAPI_API_KEY", "")
    if not key or key.startswith("<"):
        print("ERROR: Set COMETAPI_API_KEY in your environment or .env.local")
        sys.exit(1)
    return key


def collect_images(folder: str) -> list[Path]:
    """Collect image files from the given folder, sorted by size (largest first)."""
    supported = {".png", ".jpg", ".jpeg", ".webp"}
    folder_path = Path(folder)
    if not folder_path.exists():
        print(f"ERROR: Folder not found: {folder}")
        sys.exit(1)

    images = [f for f in folder_path.iterdir() if f.suffix.lower() in supported]
    if not images:
        print(f"ERROR: No supported images found in {folder}")
        sys.exit(1)

    images.sort(key=lambda f: f.stat().st_size, reverse=True)
    return images[:MAX_REFERENCE_IMAGES]


def encode_image(path: Path) -> tuple[str, str]:
    """Read and base64-encode an image, optionally downscaling if too large."""
    mime_map = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}
    mime = mime_map.get(path.suffix.lower(), "image/png")

    if Image:
        img = Image.open(path)
        w, h = img.size
        if max(w, h) > MAX_IMAGE_SIZE_PX:
            ratio = MAX_IMAGE_SIZE_PX / max(w, h)
            new_size = (int(w * ratio), int(h * ratio))
            img = img.resize(new_size, Image.LANCZOS)
            print(f"  Downscaled {path.name}: {w}x{h} -> {new_size[0]}x{new_size[1]}")

        from io import BytesIO
        buf = BytesIO()
        save_fmt = "PNG" if path.suffix.lower() == ".png" else "JPEG"
        img.save(buf, format=save_fmt, quality=90)
        data = base64.b64encode(buf.getvalue()).decode("ascii")
    else:
        data = base64.b64encode(path.read_bytes()).decode("ascii")

    return data, mime


def generate_portrait(api_key: str, image_folder: str = "", image_paths: list[Path] | None = None) -> None:
    """Send reference images + prompt to Nano Banana 2 via CometAPI."""
    import urllib.request

    if image_paths:
        images = image_paths
    else:
        images = collect_images(image_folder)
    print(f"\nFound {len(images)} reference image(s):")
    for img in images:
        print(f"  - {img.name} ({img.stat().st_size / 1024:.0f} KB)")

    parts: list[dict] = []
    print("\nEncoding images...")
    for img_path in images:
        data, mime = encode_image(img_path)
        parts.append({"inlineData": {"mimeType": mime, "data": data}})
        print(f"  Encoded {img_path.name} ({len(data) // 1024} KB base64)")

    parts.append({"text": PORTRAIT_PROMPT})

    payload = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": ASPECT_RATIO},
        },
    }

    url = f"{COMET_BASE_URL}/v1beta/models/{MODEL_ID}:generateContent"
    body = json.dumps(payload).encode("utf-8")

    print(f"\nSending request to Nano Banana 2 ({MODEL_ID})...")
    print(f"Payload size: {len(body) / (1024 * 1024):.1f} MB")

    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            response_data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print(f"\nERROR: API returned {e.code}")
        print(error_body[:2000])
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"\nERROR: Connection failed: {e.reason}")
        sys.exit(1)

    candidates = response_data.get("candidates", [])
    if not candidates:
        print("\nERROR: No candidates returned by the API")
        print(json.dumps(response_data, indent=2)[:2000])
        sys.exit(1)

    output_dir = Path(__file__).resolve().parent / "output"
    output_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    saved_count = 0

    for candidate in candidates:
        parts_out = candidate.get("content", {}).get("parts", [])
        for part in parts_out:
            inline = part.get("inlineData")
            if inline and inline.get("data"):
                ext = "png" if "png" in inline.get("mimeType", "") else "jpg"
                filename = f"portrait_{timestamp}_{saved_count}.{ext}"
                output_path = output_dir / filename

                img_bytes = base64.b64decode(inline["data"])
                output_path.write_bytes(img_bytes)
                print(f"\nPortrait saved: {output_path}")
                print(f"Size: {len(img_bytes) / 1024:.0f} KB")
                saved_count += 1

            text = part.get("text")
            if text:
                print(f"\nModel response text: {text}")

    if saved_count == 0:
        print("\nWARNING: No image data found in response")
        print(json.dumps(response_data, indent=2)[:3000])
    else:
        print(f"\nDone! Generated {saved_count} portrait(s).")


if __name__ == "__main__":
    args = sys.argv[1:]
    api_key = load_api_key()

    # If multiple args or args point to files, treat as individual image paths
    if len(args) > 1 or (len(args) == 1 and Path(args[0]).is_file()):
        image_paths = [Path(a) for a in args]
        for p in image_paths:
            if not p.exists():
                print(f"ERROR: File not found: {p}")
                sys.exit(1)
        generate_portrait(api_key, image_paths=image_paths)
    else:
        folder = args[0] if args else r"E:\Master\downloads\lora"
        api_key = load_api_key()
        generate_portrait(api_key, folder)
