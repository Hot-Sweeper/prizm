"""
Batch Portrait Generator — 5 variations using different reference photo sets
and prompt tweaks for Nano Banana 2 via CometAPI.
"""

import base64
import os
import sys
import json
import random
import concurrent.futures
from pathlib import Path
from datetime import datetime
from io import BytesIO

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
MAX_IMAGE_SIZE_PX = 1024  # smaller to keep payload manageable for batch

VARIATIONS = []
base_prompt = (
    "Using these reference photos, create a stunning photorealistic portrait photograph of this 18-year-old person "
    "{scenario}. "
    "FACE ACCURACY IS CRITICAL: perfectly match the exact facial geometry, eye shape, nose, mouth proportions, and jawline. Do not alter their identity or make it generic. "
    "Keep their EXACT same outfit from the references. Show their natural hair fading from brown at the roots to blonde at the ends. "
    "The face must be perfectly in focus and ultra-sharp. Beautifully blurred background."
)

scenarios = [
    ("v11_rainy_street", "standing on a rainy city street at night with neon sign reflections"),
    ("v12_art_gallery", "looking at an abstract painting inside an empty, modern minimalist art gallery"),
    ("v13_rooftop_sunset", "on a high-rise rooftop overlooking a dense cityscape during golden hour"),
    ("v14_train_carriage", "sitting by the window inside a moving subway train with city lights streaking by"),
    ("v15_sunny_park", "relaxing on a wooden bench in a sun-dappled green central park"),
    ("v16_coffee_shop", "working next to a large cafe window on a brisk autumn morning"),
    ("v17_cyberpunk_alley", "in a moody, futuristic cyberpunk alleyway bathed in blue and pink neon light"),
    ("v18_luxury_hotel", "standing in the grand lobby of a luxury hotel with warm golden chandeliers"),
    ("v19_snowy_window", "looking out a frosted window from inside a warm, cozy wooden cabin"),
    ("v20_urban_night", "waiting at a futuristic bus stop under harsh industrial sodium streetlights")
]

for idx, (name, scenario) in enumerate(scenarios):
    img_inds = [(idx % 5), (idx + 1) % 5, (idx + 2) % 5]
    VARIATIONS.append({
        "name": name,
        "aspect_ratio": "3:4",
        "image_indices": img_inds,
        "prompt": base_prompt.format(scenario=scenario)
    })


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


def collect_all_images(folder: str) -> list[Path]:
    supported = {".png", ".jpg", ".jpeg", ".webp"}
    folder_path = Path(folder)
    if not folder_path.exists():
        print(f"ERROR: Folder not found: {folder}")
        sys.exit(1)

    images = sorted(
        [f for f in folder_path.iterdir() if f.suffix.lower() in supported],
        key=lambda f: f.stat().st_size,
        reverse=True,
    )
    if not images:
        print(f"ERROR: No images in {folder}")
        sys.exit(1)
    return images


def encode_image(path: Path) -> tuple[str, str]:
    mime_map = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}
    mime = mime_map.get(path.suffix.lower(), "image/png")

    if Image:
        img = Image.open(path)
        w, h = img.size
        if max(w, h) > MAX_IMAGE_SIZE_PX:
            ratio = MAX_IMAGE_SIZE_PX / max(w, h)
            new_size = (int(w * ratio), int(h * ratio))
            img = img.resize(new_size, Image.LANCZOS)

        buf = BytesIO()
        save_fmt = "PNG" if path.suffix.lower() == ".png" else "JPEG"
        img.save(buf, format=save_fmt, quality=90)
        data = base64.b64encode(buf.getvalue()).decode("ascii")
    else:
        data = base64.b64encode(path.read_bytes()).decode("ascii")

    return data, mime


def generate_one(api_key: str, variation: dict, all_images: list[Path], output_dir: Path, timestamp: str) -> bool:
    from google import genai
    from google.genai import types

    name = variation["name"]
    indices = [i for i in variation["image_indices"] if i < len(all_images)]
    selected = [all_images[i] for i in indices]

    print(f"\n{'='*60}")
    print(f"  {name}")
    print(f"  Using {len(selected)} reference images:")
    for img in selected:
        print(f"    - {img.name}")
    print(f"{'='*60}")

    contents: list = []
    
    # Send actual PIL Images instead of base64 chunks
    for img_path in selected:
        if Image:
            img = Image.open(img_path)
            w, h = img.size
            if max(w, h) > MAX_IMAGE_SIZE_PX:
                ratio = MAX_IMAGE_SIZE_PX / max(w, h)
                img = img.resize((int(w*ratio), int(h*ratio)), Image.LANCZOS)
            contents.append(img)
        else:
            data, mime = encode_image(img_path)
            contents.append(types.Part.from_bytes(data=base64.b64decode(data), mime_type=mime))

    contents.append(variation["prompt"])

    client = genai.Client(
        http_options={"api_version": "v1beta", "base_url": COMET_BASE_URL},
        api_key=api_key,
    )

    print(f"  Sending to Nano Banana 2...")

    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=[*contents],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(aspect_ratio=variation["aspect_ratio"]),
            ),
        )
    except Exception as e:
        print(f"  ERROR: {e}")
        return False

    output_path = None
    for candidate in response.candidates:
        if candidate.content and candidate.content.parts:
            for part in candidate.content.parts:
                if part.inline_data and part.inline_data.data:
                    mime_out = part.inline_data.mime_type or "image/png"
                    ext = "png" if "png" in mime_out else "jpg"
                    filename = f"{name}_{timestamp}.{ext}"
                    output_path = output_dir / filename
                    output_path.write_bytes(part.inline_data.data)
                    print(f"  SAVED: {output_path.name} ({len(part.inline_data.data)//1024} KB)")
                    return True
                elif part.text:
                    print(f"  Model text: {part.text}")

    if not output_path:
        print(f"  WARNING: No image data in response")
    return False


if __name__ == "__main__":
    folder = sys.argv[1] if len(sys.argv) > 1 else r"E:\Master\downloads\lora"
    api_key = load_api_key()
    all_images = collect_all_images(folder)

    print(f"Found {len(all_images)} total reference images in folder")
    for i, img in enumerate(all_images):
        print(f"  [{i}] {img.name} ({img.stat().st_size // 1024} KB)")

    output_dir = Path(__file__).resolve().parent / "output"
    output_dir.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    success = 0
    print(f"\n>>> Generating 10 variations CONCURRENTLY...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {
            executor.submit(generate_one, api_key, var, all_images, output_dir, timestamp): var 
            for var in VARIATIONS
        }
        for future in concurrent.futures.as_completed(futures):
            try:
                res = future.result()
                if res:
                    success += 1
            except Exception as exc:
                print(f"Exception generated for variation: {exc}")

    print(f"\n{'='*60}")
    print(f"  DONE: {success}/5 portraits generated successfully")
    print(f"  Output folder: {output_dir}")
    print(f"{'='*60}")
