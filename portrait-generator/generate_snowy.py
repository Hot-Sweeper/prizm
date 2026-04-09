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
    "BODY TYPE: The person has a slim, youthful, and slightly athletic body with an elegant figure. "
    "{theme_desc}. {outfit_details}. {lighting}. Ultra-sharp focus, photorealistic quality."
)

theme_definitions = {
    "snowy_tanktop": {
        "desc": "The scene is a snowy winter landscape with fresh white snow. Despite the cold, the person is wearing a trendy summer tank top, creating a cool, confident, fashion-forward contrast against the snowy background.",
        "variations": [
            ("v1", "wearing a plain white ribbed cropped tank top, bare arms", "Bright crisp winter morning light reflecting off the snow"),
            ("v2", "wearing a tight black spaghetti strap tank top", "Soft overcast winter daylight"),
            ("v3", "wearing a pastel pink halter tank top, shivering slightly but posing perfectly", "Golden hour sunset over snowy evergreen trees"),
            ("v4", "wearing a sporty grey cropped tank top with a heavy unzipped winter coat falling off the shoulders", "Moody blue twilight in the snow"),
            ("v5", "wearing a cute white lace-trim tank top", "High-contrast bright midday sun on a snowy mountain")
        ]
    },
    "cute_snowy": {
        "desc": "The scene is a beautiful snowy winter wonderland. The person is dressed appropriately in adorable, stylish winter fashion.",
        "variations": [
            ("v1", "wearing a fluffy oversized white faux-fur winter jacket and cute white fuzzy ear muffs", "Soft magical snowfall, bright and airy lighting"),
            ("v2", "wearing a cute thick pastel blue knit turtleneck sweater", "Warm glowing sunshine peaking through snowy pine branches"),
            ("v3", "wearing an elegant beige wool coat with a matching cozy scarf wrapped around the neck", "Early morning frost, soft delicate light"),
            ("v4", "wearing a cozy red plaid jacket over a dark turtleneck", "Warm sunset glow casting long shadows on the snow"),
            ("v5", "wearing a trendy clean white puffer jacket with a cute knit beanie", "Crisp, clear, ultra-bright sunny winter day")
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
                
        # If no inlineData found but text is present, log it
        for part in content.get("parts", []):
            if "text" in part:
                print(f"  [{theme} | {name}] Model Text Response: {part['text']}")

    return False


if __name__ == "__main__":
    api_key = load_api_key()
    output_dir = Path(__file__).resolve().parent / "output" / "snowy_outfits"
    output_dir.mkdir(exist_ok=True, parents=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    print(f">>> Encoding the {len(files)} reference photos...")
    image_parts = get_image_parts(files)

    success = 0
    print(f">>> Generating {len(VARIATIONS)} total variations CONCURRENTLY with gemini-3.1-flash-image-preview...")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {
            executor.submit(generate_one, api_key, var, image_parts, output_dir, timestamp): var 
            for var in VARIATIONS
        }
        for future in concurrent.futures.as_completed(futures):
            rtn = future.result()
            if rtn: success += 1

    print(f"DONE: {success}/{len(VARIATIONS)} portraits generated successfully in {output_dir}")