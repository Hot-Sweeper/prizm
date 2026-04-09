import base64
import os
import sys
import json
import urllib.request
import urllib.error
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

COMET_BASE_URL = "https://api.cometapi.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent"
MAX_IMAGE_SIZE_PX = 1024

files = [
    r"C:\Users\tim\ai general webpage\portrait-generator\output\peak\v13_rooftop_sunset_20260409_004234.png",
    r"C:\Users\tim\ai general webpage\portrait-generator\output\peak\v18_luxury_hotel_20260409_004234.png",
    r"E:\Master\downloads\lora\Screenshot 2026-04-08 231706.png",
    r"E:\Master\downloads\lora\Screenshot 2026-04-08 232750.png"
]

VARIATIONS = []
base_prompt = (
    "Using these reference photos of this specific person, create a stunning high-quality photorealistic portrait photograph. "
    "FACE ACCURACY IS CRITICAL: perfectly match the exact facial geometry, eye shape, nose, mouth proportions, and jawline of the person. "
    "Do not alter their identity or make it generic. "
    "The person is 18 years old — preserve their youthful face, do NOT age them up. "
    "The scene is a beautiful sunny beach. The person is wearing a cute, stylish, and flattering beach outfit ({outfit_details}). "
    "IMPORTANT: Show their natural hair fading from brown at the roots to blonde at the ends. "
    "Face and upper body. {lighting}. Ultra-sharp focus, photorealistic quality."
)

scenarios = [
    ("v1_beach_white_dress", "like a white flowing summer sundress", "Bright midday sun, soft white sand"),
    ("v2_beach_floral", "like a cute tropical floral pattern dress", "Golden hour lighting with deep orange tones"),
    ("v3_beach_casual", "like a chic crochet top and denim shorts", "Soft morning light, gentle ocean waves"),
    ("v4_beach_elegant", "like an elegant silk beach cover-up", "Sunset glow with a warm breeze"),
    ("v5_beach_boho", "like a bohemian knit two-piece set", "Bright and airy noon light, crystal clear water"),
    ("v6_beach_pastel", "like a pastel colored light linen shirt", "Golden hour sunset with pinkish sky"),
    ("v7_beach_stripes", "like a sailor striped breezy beach dress", "Early morning soft, diffused seaside lighting"),
    ("v8_beach_chic", "like a cute chic bright red summer romper", "High contrast dramatic fashion photography lighting"),
    ("v9_beach_island", "like a tropical sarong wrap over a bikini", "Vibrant saturated colors, bright sunlight reflection"),
    ("v10_beach_resort", "like a sheer beach dress", "Soft twilight with warm cafe lights in the background")
]

for idx, (name, outfit, lighting) in enumerate(scenarios):
    VARIATIONS.append({
        "name": name,
        "aspect_ratio": "3:4",
        "prompt": base_prompt.format(outfit_details=outfit, lighting=lighting)
    })


def load_api_key() -> str:
    if load_dotenv:
        env_local = Path(__file__).resolve().parent.parent / ".env.local"
        if env_local.exists():
            load_dotenv(env_local)
        else:
            load_dotenv()
    key = os.environ.get("COMETAPI_API_KEY", "")
    if not key:
        print("ERROR: Set COMETAPI_API_KEY")
        sys.exit(1)
    return key


def get_image_parts(file_paths: list[str]) -> list[dict]:
    parts = []
    for fp in file_paths:
        img = Image.open(fp)
        w, h = img.size
        if max(w, h) > MAX_IMAGE_SIZE_PX:
            ratio = MAX_IMAGE_SIZE_PX / max(w, h)
            new_size = (int(w * ratio), int(h * ratio))
            img = img.resize(new_size, Image.LANCZOS)

        buf = BytesIO()
        ext = Path(fp).suffix.lower()
        save_fmt = "PNG" if ext == ".png" else "JPEG"
        mime = f"image/{'png' if ext == '.png' else 'jpeg'}"
        img.save(buf, format=save_fmt, quality=85)

        b64data = base64.b64encode(buf.getvalue()).decode("ascii")
        parts.append({"inline_data": {"mime_type": mime, "data": b64data}})
    return parts


def generate_one(api_key: str, variation: dict, text_parts: list[dict], output_dir: Path, timestamp: str) -> bool:
    name = variation["name"]
    print(f"  [{name}] Sending request...")

    payload = {
        "contents": [{
            "parts": text_parts + [{"text": variation["prompt"]}]
        }],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {
                "aspectRatio": variation["aspect_ratio"]
            }
        }
    }

    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        COMET_BASE_URL,
        data=body,
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"  [{name}] ERROR: {e}")
        return False

    for candidate in data.get("candidates", []):
        content = candidate.get("content", {})
        for part in content.get("parts", []):
            if "inlineData" in part:
                inline = part["inlineData"]
                b64 = inline.get("data", "")
                mime_out = inline.get("mimeType", "image/png")
                ext = "png" if "png" in mime_out else "jpg"
                filename = f"beach_{name}_{timestamp}.{ext}"
                output_path = output_dir / filename
                output_path.write_bytes(base64.b64decode(b64))
                print(f"  [{name}] SAVED: {output_path.name}")
                return True
    return False


if __name__ == "__main__":
    api_key = load_api_key()
    output_dir = Path(__file__).resolve().parent / "output" / "beach_batch"
    output_dir.mkdir(exist_ok=True, parents=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    print(">>> Encoding the 4 reference photos...")
    image_parts = get_image_parts(files)

    success = 0
    print(f">>> Generating 10 Beach variations CONCURRENTLY...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {
            executor.submit(generate_one, api_key, var, image_parts, output_dir, timestamp): var 
            for var in VARIATIONS
        }
        for future in concurrent.futures.as_completed(futures):
            rtn = future.result()
            if rtn: success += 1

    print(f"DONE: {success}/10 portraits generated successfully.")