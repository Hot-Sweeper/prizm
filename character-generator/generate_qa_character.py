"""
Character Generator — Lemon Head Q&A Pose
Generates an image of the lemon-headed character in a Q&A/interview pose using CometAPI.
"""
import base64
import os
import sys
import json
from pathlib import Path
from datetime import datetime
from typing import Optional

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
ASPECT_RATIO = "1:1"  # square orientation
MAX_IMAGE_SIZE_PX = 1536

QA_POSE_PROMPT = (
    "Using the provided reference image, keep the exact same art style, same painterly aesthetic, "
    "and identically replicate the lemon head character (same face, same smile, exact same shape in the painting). "
    "Keep the exact same lighting and background aesthetic too. "
    "The ONLY change is the pose: The character is sitting in a Q&A interview pose: seated comfortably, "
    "one hand elegantly raised in a gesture as if explaining or answering a question, body slightly turned "
    "toward the viewer. "
)


def load_api_key() -> str:
    """Load CometAPI key from environment or .env.local."""
    if load_dotenv:
        env_local = Path(__file__).resolve().parent.parent / ".env.local"
        if env_local.exists():
            load_dotenv(dotenv_path=str(env_local), override=True)
        else:
            load_dotenv(override=True)

    key = os.environ.get("COMETAPI_API_KEY", "")
    if not key or key.startswith("<"):
        print("ERROR: Set COMETAPI_API_KEY in your environment or .env.local")
        sys.exit(1)
    return key


def encode_image(path: Path) -> tuple[str, str]:
    """Read and base64-encode an image, optionally downscaling if too large."""
    mime_map = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp"
    }
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


def generate_qa_character(
    reference_image_path: Optional[str] = None,
    output_dir: Optional[str] = None
) -> str:
    """
    Generate the lemon-headed character in Q&A pose.

    Args:
        reference_image_path: Optional path to reference image of the character
        output_dir: Directory to save the generated image

    Returns:
        Path to the saved image file
    """
    import requests

    api_key = load_api_key()

    if output_dir is None:
        output_dir = Path(__file__).resolve().parent / "output"
    else:
        output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Prepare the request payload
    headers = {
        "x-goog-api-key": api_key,
        "Content-Type": "application/json"
    }

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": QA_POSE_PROMPT}
                ]
            }
        ],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": ASPECT_RATIO},
        }
    }

    # Add reference image if provided
    if reference_image_path:
        ref_path = Path(reference_image_path)
        if ref_path.exists():
            print(f"Using reference image: {ref_path}")
            image_data, mime_type = encode_image(ref_path)
            payload["contents"][0]["parts"].insert(0, {
                "inlineData": {
                    "mimeType": mime_type,
                    "data": image_data
                }
            })
        else:
            print(f"Warning: Reference image not found: {ref_path}")

    print(f"\nGenerating lemon head character in Q&A pose...")
    print(f"Model: {MODEL_ID}")
    print(f"Prompt: {QA_POSE_PROMPT[:100]}...")

    # Make the API request
    response = requests.post(
        f"{COMET_BASE_URL}/v1beta/models/{MODEL_ID}:generateContent",
        headers=headers,
        json=payload,
        timeout=300
    )

    if response.status_code != 200:
        print(f"ERROR: API request failed with status {response.status_code}")
        print(f"Response: {response.text}")
        sys.exit(1)

    result = response.json()

    # Extract image from response
    image_data = None
    text_response = None

    if "candidates" in result and len(result["candidates"]) > 0:
        candidate = result["candidates"][0]
        if "content" in candidate and "parts" in candidate["content"]:
            for part in candidate["content"]["parts"]:
                if "inlineData" in part:
                    image_data = base64.b64decode(part["inlineData"]["data"])
                elif "text" in part:
                    text_response = part["text"]

    if not image_data:
        print("ERROR: No image data in response")
        print(f"Full response: {json.dumps(result, indent=2)}")
        sys.exit(1)

    # Save the generated image
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = output_dir / f"lemon_head_qa_{timestamp}.png"

    with open(output_path, "wb") as f:
        f.write(image_data)

    print(f"\n✓ Generated image saved to: {output_path}")
    if text_response:
        print(f"Model response: {text_response}")

    return str(output_path)


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Generate lemon-headed character in Q&A pose"
    )
    parser.add_argument(
        "--reference", "-r",
        help="Path to reference image of the character"
    )
    parser.add_argument(
        "--output", "-o",
        help="Output directory for generated image",
        default=None
    )

    args = parser.parse_args()

    try:
        output_path = generate_qa_character(
            reference_image_path=args.reference,
            output_dir=args.output
        )
        print(f"\nSuccess! Image saved to: {output_path}")
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
