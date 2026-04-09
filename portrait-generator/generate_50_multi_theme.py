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
    "FACE ACCURACY IS CRITICAL: perfectly match the exact facial geometry, eye shape, nose, mouth proportions, and jawline of the person. "
    "Do not alter their identity or make it generic. "
    "The person is 18 years old — preserve their youthful face, do NOT age them up. "
    "IMPORTANT: Show their natural hair fading from brown at the roots to blonde at the ends. "
    "Face and upper body. {theme_desc}. {outfit_details}. {lighting}. Ultra-sharp focus, photorealistic quality."
)

theme_definitions = {
    "cozy_winter": {
        "desc": "The scene is a cozy winter cabin covered in snow.",
        "variations": [
            ("v1", "wearing an oversized beige knit sweater", "Warm fireplace lighting inside"),
            ("v2", "wearing a red plaid flannel shirt", "Morning light shining through a frosted window"),
            ("v3", "wearing a fluffy white coat and beanie", "Bright snowy daylight reflecting on face"),
            ("v4", "wearing a thick grey turtleneck sweater", "Golden hour sunset over snowy mountains"),
            ("v5", "wearing a stylish black winter parka", "Cool blue twilight illumination"),
            ("v6", "wearing a cream-colored scarf and coat", "Soft overcast winter lighting"),
            ("v7", "wearing a dark green knit cardigan", "Warm string lights in the background"),
            ("v8", "wearing a white fuzzy earmuff and sweater", "Crisp high-contrast midday winter sun"),
            ("v9", "wearing a burgundy velvet coat", "Soft candlelight glow"),
            ("v10", "wearing a chic brown shearling jacket", "Cozy sunset light through the cabin timber")
        ]
    },
    "cyberpunk_neon": {
        "desc": "The scene is a futuristic cyberpunk city alley bathed in neon lights.",
        "variations": [
            ("v1", "wearing a sleek black leather jacket with glowing blue trim", "Blue and pink neon lighting reflecting on wet skin"),
            ("v2", "wearing a metallic silver techwear top", "Harsh red neon sign illumination"),
            ("v3", "wearing a dark hooded cyberpunk windbreaker", "Cyan holographic light shining from below"),
            ("v4", "wearing a stylish translucent rain coat", "Rainy night with blurry streetlights"),
            ("v5", "wearing an asymmetric futuristic gray vest", "Bright purple neon glow on the side of the face"),
            ("v6", "wearing a high-collar black tactical jacket", "Moody dark shadows with harsh rim lighting"),
            ("v7", "wearing a shiny vinyl crop jacket", "Vibrant green and yellow electric lights"),
            ("v8", "wearing a glowing white synthetic top", "Laser-like blue beams in the background"),
            ("v9", "wearing an iridescent multi-color trench coat", "Soft glowing mist with scattered neon highlights"),
            ("v10", "wearing a dark matte streetwear hoodie", "Cyberpunk advertising billboards illuminating the face")
        ]
    },
    "spring_garden": {
        "desc": "The scene is a beautiful blooming spring garden full of colorful flowers.",
        "variations": [
            ("v1", "wearing a cute pastel floral wrap dress", "Bright clear morning sunlight"),
            ("v2", "wearing a white lace sundress", "Soft diffused light under a large oak tree"),
            ("v3", "wearing a light pink silk blouse", "Golden hour light with lens flares"),
            ("v4", "wearing a pale yellow spring romper", "Dappled sunlight filtering through green leaves"),
            ("v5", "wearing an elegant lavender midi dress", "Sunset glow hitting the flower petals"),
            ("v6", "wearing a sheer organza top", "Overcast soft studio-like lighting outdoors"),
            ("v7", "wearing a green cottagecore linen dress", "Warm rays of light bouncing off a pond"),
            ("v8", "wearing a cute denim overall over a white tee", "Bright midday sun with crisp shadows"),
            ("v9", "wearing a romantic tiered ruffle dress", "Backlit by the setting sun"),
            ("v10", "wearing a crisp white button-up shirt", "Soft pastel sky light just after sunrise")
        ]
    },
    "high_fashion": {
        "desc": "The scene is a high-end luxury studio or gala setting.",
        "variations": [
            ("v1", "wearing a glamorous black silk evening gown", "Dramatic fashion studio spotlight"),
            ("v2", "wearing a sparkling silver sequin dress", "Flash photography with sharp shadows"),
            ("v3", "wearing an elegant deep red velvet slip dress", "Warm chandeliers softly glowing in background"),
            ("v4", "wearing a chic tailored white pantsuit", "Clean, bright, high-key studio lighting"),
            ("v5", "wearing a sheer black tulle haute couture top", "Moody, cinematic rim lighting"),
            ("v6", "wearing a stunning gold lamé halter dress", "Paparazzi style bright flashes"),
            ("v7", "wearing an avant-garde geometric black dress", "Harsh directional light from one side"),
            ("v8", "wearing a classic Hollywood emerald green gown", "Soft beauty dish lighting on the face"),
            ("v9", "wearing a luxurious beige cashmere coat dress", "Elegant warm gallery lighting"),
            ("v10", "wearing a dark navy satin wrap dress", "Subtle spotlights cutting through a dark room")
        ]
    },
    "casual_streetwear": {
        "desc": "The scene is a trendy casual day out in a modern city.",
        "variations": [
            ("v1", "wearing a baggy vintage band tee and layered necklaces", "Urban afternoon sunlight"),
            ("v2", "wearing a trendy oversized beige blazer over a white top", "Soft light near a glass cafe window"),
            ("v3", "wearing a cute cropped pastel cardigan", "Sunny day on a bustling city sidewalk"),
            ("v4", "wearing a dark grey hoodie under a denim jacket", "Overcast moody city lighting"),
            ("v5", "wearing a stylish neutral-toned knit vest", "Warm sunset light bouncing off skyscrapers"),
            ("v6", "wearing a white ribbed tank top and casual shirt", "Bright, clear daylight with crisp urban shadows"),
            ("v7", "wearing an olive green oversized corduroy shirt", "Golden hour light in a small street market"),
            ("v8", "wearing a graphic streetwear sweatshirt", "Cool shaded illumination under a concrete bridge"),
            ("v9", "wearing a soft pink fluffy cropped sweater", "Reflected sunlight from nearby glass buildings"),
            ("v10", "wearing a classic white t-shirt and leather jacket", "Dusk falling over the city with streetlamps turning on")
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
        # Resize to max 1024 to keep payload lightweight for 50 parallel reqs
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

    # Combine images + text prompt but make sure images are separate parts
    payload = {
        "contents": [{
            "parts": image_parts + [{"text": variation["prompt"]}]
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
    return False


if __name__ == "__main__":
    api_key = load_api_key()
    output_dir = Path(__file__).resolve().parent / "output" / "multi_theme"
    output_dir.mkdir(exist_ok=True, parents=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    print(f">>> Encoding the {len(files)} reference photos...")
    image_parts = get_image_parts(files)

    success = 0
    print(f">>> Generating {len(VARIATIONS)} total variations CONCURRENTLY (5 Themes x 10 Variations)...")
    
    # We'll use 10 workers to keep requests flowing but not overwhelm the API connection pool
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {
            executor.submit(generate_one, api_key, var, image_parts, output_dir, timestamp): var 
            for var in VARIATIONS
        }
        for future in concurrent.futures.as_completed(futures):
            rtn = future.result()
            if rtn: success += 1

    print(f"DONE: {success}/{len(VARIATIONS)} portraits generated successfully in {output_dir}")