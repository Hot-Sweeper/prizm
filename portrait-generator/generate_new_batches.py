import base64
import os
import sys
import json
import urllib.request
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

base_prompt = (
    "Using these reference photos of this specific person, create a stunning high-quality photorealistic portrait photograph. "
    "FACE ACCURACY IS CRITICAL: match the exact facial geometry, eye shape, and nose of the person. "
    "IMPORTANT FACIAL REFINEMENT: Very subtly give the face a slightly less bloated, naturally slimmer appearance with a very subtly sharper, more defined chin and jawline. Keep it looking completely natural and preserve their exact identity. "
    "The person is 18 years old — preserve their youthful face, do NOT age them up. "
    "IMPORTANT: Show their natural hair fading from brown at the roots to blonde at the ends. "
    "BODY TYPE: The person has a slim, youthful, and slightly athletic body. "
    "{theme_desc}. {outfit_details}. {lighting}. Ultra-sharp focus, photorealistic quality."
)

theme_definitions = {
    "face_closeups": {
        "desc": "This is an extreme close-up macro portrait focusing entirely on the face and eyes, showing incredible skin texture and breathtaking eye detail. Tight framing.",
        "variations": [
            ("v1", "wearing a simple dark top just barely visible at the neck", "Soft, beautiful golden hour sunlight illuminating the eyes perfectly"),
            ("v2", "wearing a delicate silver necklace on the collarbone", "Cinematic dramatic lighting with deep shadows on one side of the face"),
            ("v3", "no distracting clothing, purely focused on the face", "Bright, natural, overcast daylight for soft, flawless skin tones"),
            ("v4", "collar of a white shirt visible", "Vibrant warm rim lighting gently hitting the side of the natural jawline"),
            ("v5", "hair gently blowing across the face, collar of a denim jacket", "Moody neon city lights reflecting beautifully in the eyes")
        ]
    },
    "trap_streetwear": {
        "desc": "The scene is a gritty, cool, underground urban environment. The aesthetic is alternative hood trap streetwear.",
        "variations": [
            ("v1", "wearing an oversized black heavy graphic hoodie with thick silver cuban link chains", "Harsh flash photography style at night time"),
            ("v2", "wearing a dark vintage rap tee over a long-sleeve thermal, baggy dark cargo pants, and a dark beanie", "Moody street lamp lighting in a dark alleyway"),
            ("v3", "wearing an oversized dark puffer jacket zipped down over a dark hoodie, silver rings and accessories", "Cool blue and green industrial lighting inside an abandoned warehouse"),
            ("v4", "wearing alternative techwear straps over a black oversized t-shirt, relaxed confident posture", "Neon glow leaking from a nearby storefront at midnight"),
            ("v5", "wearing an oversized faded dark grey zip-up hoodie over a white tank top, baggy streetwear denim", "Low-angle shot with intense late afternoon sun casting long urban shadows")
        ]
    }
}

VARIATIONS = []
for theme_name, theme_data in theme_definitions.items():
    theme_desc = theme_data["desc"]
    for var_name, outfit, lighting in theme_data["variations"]:
        prompt = base_prompt.format(theme_desc=theme_desc, outfit_details=outfit, lighting=lighting)
        VARIATIONS.append({
            "theme": theme_name,
            "name": var_name,
            "aspect_ratio": "3:4",
            "prompt": prompt
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
        if max(w, h) > 1024:
            ratio = 1024 / max(w, h)
            new_size = (int(w * ratio), int(h * ratio))
            img = img.resize(new_size, Image.LANCZOS)

        buf = BytesIO()
        ext = Path(fp).suffix.lower()
        save_fmt = "PNG" if ext == ".png" else "JPEG"
        mime = f"image/{'png' if ext == '.png' else 'jpeg'}"
        img.save(buf, format=save_fmt, quality=80) 

        b64data = base64.b64encode(buf.getvalue()).decode("ascii")
        parts.append({"inline_data": {"mime_type": mime, "data": b64data}})
    return parts


def generate_one(api_key: str, variation: dict, image_parts: list[dict], output_base: Path, timestamp: str) -> bool:
    theme = variation["theme"]
    name = variation["name"]
    print(f"  [{theme} | {name}] Sending request...")

    payload = {
        "contents": [{
            "parts": image_parts + [{"text": variation["prompt"]}]
        }],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {
                "aspectRatio": "3:4"
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
        print(f"  [{theme} | {name}] ERROR: {e}")
        return False

    theme_dir = output_base / theme
    theme_dir.mkdir(exist_ok=True, parents=True)

    for candidate in data.get("candidates", []):
        content = candidate.get("content", {})
        for part in content.get("parts", []):
            if "inlineData" in part:
                inline = part["inlineData"]
                b64 = inline.get("data", "")
                mime_out = inline.get("mimeType", "image/png")
                ext = "png" if "png" in mime_out else "jpg"
                filename = f"{name}_{timestamp}.{ext}"
                output_path = theme_dir / filename
                output_path.write_bytes(base64.b64decode(b64))
                print(f"  [{theme} | {name}] SAVED: {output_path.name}")
                return True
            
            # Catch API safety warnings if they trigger
            elif part.get("text"):
                print(f"  [{theme} | {name}] Model Response: {part.get('text')}")

    return False


if __name__ == "__main__":
    api_key = load_api_key()
    output_dir = Path(__file__).resolve().parent / "output" / "closeups_and_trap"
    output_dir.mkdir(exist_ok=True, parents=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    print(f">>> Encoding the {len(files)} reference photos...")
    image_parts = get_image_parts(files)

    success = 0
    print(f">>> Generating {len(VARIATIONS)} total variations CONCURRENTLY...")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {
            executor.submit(generate_one, api_key, var, image_parts, output_dir, timestamp): var 
            for var in VARIATIONS
        }
        for future in concurrent.futures.as_completed(futures):
            rtn = future.result()
            if rtn: success += 1

    print(f"DONE: {success}/{len(VARIATIONS)} portraits generated successfully in {output_dir}")