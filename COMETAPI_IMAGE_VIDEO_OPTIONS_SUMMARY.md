# CometAPI Image and Video Options Summary

- Generated: 2026-05-07 UTC
- Source: CometAPI OpenAPI docs and endpoint pages
- Scope: image and video generation/editing endpoints with visible request options
- Important: options are endpoint-specific and often model-specific. The public model catalog does not expose a full capability matrix.

## What This File Covers

This file focuses on the options you asked about:

- aspect ratios
- sizes and resolutions
- quality levels
- seeds
- negative prompts
- durations
- prompt guidance controls
- output formats
- masks, references, and callback fields

## Quick Takeaways

- There is no single universal Comet image/video request schema.
- OpenAI-style image routes use `size`, `quality`, and `output_format`.
- Flux exposes the most explicit low-level image controls: `width`, `height`, `steps`, `seed`, `guidance`, `safety_tolerance`.
- Gemini image routes expose the clearest aspect-ratio and image-size matrix.
- Kling video routes expose `negative_prompt`, aspect ratios, duration, mode, and camera controls.
- Seedance and Sora both use `/v1/videos`, but with different allowed fields and different model-specific constraints.

## Endpoint Tree

- Image
  - POST `/v1/images/generations`
  - POST `/v1/images/edits`
  - POST `/flux/v1/{model}`
  - GET `/flux/v1/get_result`
  - POST `/v1beta/models/{model}:generateContent`
- Video
  - POST `/v1/videos` for Sora
  - POST `/v1/videos` for Veo
  - POST `/v1/videos` for Seedance
  - GET `/v1/videos/{video_id}` or `/v1/videos/{id}`
  - GET `/v1/videos/{video_id}/content`
  - POST `/kling/v1/videos/text2video`
  - POST `/kling/v1/videos/image2video`
  - GET `/kling/v1/{action}/{action2}/{task_id}`
  - POST `/runway/pro/generate`

## Image Endpoints

### OpenAI-compatible image generation
Path: `POST /v1/images/generations`

Core fields:

- `model`: image model id such as `dall-e-3` or `gpt-image-2`
- `prompt`: required text prompt
- `n`: number of images, docs recommend keeping this at `1` for widest compatibility
- `quality`: model-dependent quality setting
- `size`: model-dependent output size, example `1024x1024`
- `response_format`: enum `url`, `b64_json`
  - mainly for DALL-E style routes
- `output_format`: encoded image type for GPT image models
  - docs mention examples like `png`, `jpeg`, `webp`

Observed docs examples:

- `model=gpt-image-2`
- `quality=low`
- `size=1024x1024`
- `output_format=jpeg`

What is not explicitly documented here:

- no documented `seed`
- no documented `negative_prompt`
- exact supported sizes vary by model

### OpenAI-compatible image editing
Path: `POST /v1/images/edits`

Core fields:

- `image`: required source image file
- `prompt`: required edit instruction
- `model`: defaults to `gpt-image-2`
- `mask`: optional PNG mask
- `n`: number of edited images
- `quality`: enum `high`, `medium`, `low`
- `response_format`: enum `url`, `b64_json`
- `output_format`: encoded image type for GPT image edit results
- `size`: requested output size when supported by selected model

What this gives you:

- edit-mask support
- explicit quality levels
- output encoding control

What is not explicitly documented here:

- no documented `seed`
- no documented `negative_prompt`

### Flux image generation
Path: `POST /flux/v1/{model}`

Model path examples from docs:

- `flux-pro-1.1`
- `flux-pro`
- `flux-dev`
- `flux-pro-1.1-ultra`

Core fields:

- `prompt`: required text prompt
- `image_prompt`: reference image URL
- `width`: integer, multiple of 32, model-dependent range
- `height`: integer, multiple of 32, model-dependent range
- `steps`: diffusion step count
- `prompt_upsampling`: boolean
- `seed`: integer for reproducibility
- `guidance`: numeric prompt-adherence control
- `safety_tolerance`: integer range `0-6`
- `interval`: diversity interval
- `output_format`: enum-like docs values `jpeg`, `png`
- `webhook_url`
- `webhook_secret`

This is one of the best endpoints if you want explicit control over:

- resolution via width and height
- deterministic output via seed
- prompt adherence via guidance
- quality vs latency via steps

### Gemini image generation
Path: `POST /v1beta/models/{model}:generateContent`

Core fields:

- `model`: path param, example `gemini-3.1-flash-image-preview`
- `contents[]`: conversation-style request body with text and optional inline images
- `generationConfig.responseModalities[]`: enum `TEXT`, `IMAGE`
- `generationConfig.imageConfig.aspectRatio`
- `generationConfig.imageConfig.imageSize`
- `generationConfig.thinkingConfig.thinkingLevel`
- `generationConfig.thinkingConfig.includeThoughts`
- `tools[].google_search`

Aspect ratios from docs:

All models:

- `1:1`
- `2:3`
- `3:2`
- `3:4`
- `4:3`
- `4:5`
- `5:4`
- `9:16`
- `16:9`
- `21:9`

Additional ratios for Gemini 3.1 Flash image preview:

- `1:4`
- `4:1`
- `1:8`
- `8:1`

Image sizes from docs:

- `512px`
- `1K`
- `2K`
- `4K`

Thinking config:

- `thinkingLevel`: `minimal`, `high`
- `includeThoughts`: boolean

What Gemini gives you that others often do not:

- broad aspect-ratio support
- explicit output-resolution tiers
- multi-image composition
- image-to-image via inline image data
- optional search grounding

What is not explicitly documented here:

- no standard `seed`
- no standard `negative_prompt`

## Video Endpoints

### Sora video creation
Path: `POST /v1/videos`

Core fields:

- `prompt`: required
- `model`: default `sora-2`
- `seconds`: enum `4`, `8`, `12`
- `size`: enum
  - `720x1280`
  - `1280x720`
  - `1024x1792`
  - `1792x1024`
- `input_reference`: optional image file

Good to know:

- this is async
- poll `GET /v1/videos/{video_id}`
- download result from `GET /v1/videos/{video_id}/content`

What is not explicitly documented here:

- no `negative_prompt`
- no `seed`
- no free-form aspect ratio field; use supported `size` values instead

### Veo async generation
Path: `POST /v1/videos`

Core fields:

- `prompt`: required
- `model`: example `veo3-fast`
- `size`: orientation hint, example `16x9` or `9x16`
- `input_reference`: optional image input
  - one file for image-to-video
  - two ordered files for first-frame and last-frame guidance

What is visible in docs:

- docs describe `size` as an orientation hint, not a detailed resolution enum
- returned response includes `seconds`, `size`, `status`

What is not explicitly documented here:

- no `negative_prompt`
- no `seed`
- no documented duration enum in the create schema shown

### Seedance video creation
Path: `POST /v1/videos`

Core fields:

- `prompt`: required
- `model`: enum
  - `doubao-seedance-2-0`
  - `doubao-seedance-2-0-fast`
  - `doubao-seedance-1-5-pro`
  - `doubao-seedance-1-0-pro`
- `seconds`: integer, model-specific range
- `size`: ratio preset or exact `WxH`
- `input_reference`: optional image file, only for 2.0 models

Supported ratio presets from docs:

- `16:9`
- `4:3`
- `1:1`
- `3:4`
- `9:16`
- `21:9`

Model-specific ratio notes:

- `doubao-seedance-1-0-pro` and `doubao-seedance-1-5-pro`
  - support `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `21:9`
- `doubao-seedance-2-0`
  - supports `16:9`, `4:3`, `1:1`, `3:4`, `21:9`
- `doubao-seedance-2-0-fast`
  - supports `4:3`, `3:4`, `9:16`, `21:9`

Exact-size examples from docs:

- `1280x720`
- `1920x1080`
- `1112x834`
- `960x960`
- `834x1112`
- `720x1280`
- `1080x1920`
- `1470x630`

Duration ranges from docs:

- `doubao-seedance-2-0` and `doubao-seedance-2-0-fast`: `4-15`
- `doubao-seedance-1-5-pro`: `4-12`
- `doubao-seedance-1-0-pro`: `2-10`

What this endpoint gives you:

- the clearest size and ratio behavior among video routes
- exact size plus ratio preset support
- image-to-video mode for 2.0 family only

What is not explicitly documented here:

- no `negative_prompt`
- no `seed`

### Kling text-to-video
Path: `POST /kling/v1/videos/text2video`

Core fields:

- `prompt`: required, max 500 chars
- `negative_prompt`: max 200 chars
- `aspect_ratio`
- `callback_url`
- `model_name`
- `cfg_scale`: range `0-1`
- `mode`: enum `std`, `pro`
- `duration`: options `5`, `10`
- `camera_control`
- `external_task_id`

Aspect ratios from docs:

- `16:9`
- `9:16`
- `1:1`
- `4:3`
- `3:4`
- `3:2`
- `2:3`

Camera control presets:

- `simple`
- `down_back`
- `forward_up`
- `right_turn_forward`
- `left_turn_forward`

Manual camera axes in `camera_control.config`:

- `horizontal`: integer `-10` to `10`
- `vertical`: integer `-10` to `10`
- `pan`: integer `-10` to `10`
- `tilt`: integer `-10` to `10`
- `roll`: integer `-10` to `10`
- `zoom`: integer `-10` to `10`

This is the best documented Comet video route for:

- negative prompts
- aspect ratios
- prompt guidance strength
- quality mode selection
- camera motion control

### Kling image-to-video
Path: `POST /kling/v1/videos/image2video`

Core fields:

- `prompt`
- `negative_prompt`
- `image`: required, base64 string or public URL
- `callback_url`
- `mode`
- `model_name`
- `image_tail`: last-frame guide image
- `cfg_scale`: range `0-1`
- `duration`: options `5`, `10`
- `static_mask`
- `dynamic_masks`
- `external_task_id`

Input constraints from docs:

- accepted image formats: JPG, JPEG, PNG
- max 10 MB
- minimum 300x300 px

Dynamic mask fields:

- `dynamic_masks.mask`
- `dynamic_masks.trajectories[].x`
- `dynamic_masks.trajectories[].y`

What this endpoint gives you:

- negative prompts
- image-to-video
- first/last frame style guidance
- frozen-area masking
- trajectory-based motion painting

### Runway compatibility text-to-video
Path: `POST /runway/pro/generate`

Headers:

- `X-Runway-Version`: optional, example `2024-11-06`

Core fields:

- `callback_url`: required
- `ratio`: docs examples include `16:9`, `9:16`, `1:1`
- `prompt`: required
- `style`: required, example `cinematic`
- `model`: required, example `gen4`
- `options.seconds`: required
- `options.motion_vector`

Motion vector fields:

- `x`
- `y`
- `z`
- `r`
- `bg_x_pan`
- `bg_y_pan`

What this endpoint gives you:

- aspect ratio
- style selection
- explicit duration
- low-level camera and background motion controls

What is not explicitly documented here:

- no `negative_prompt`
- no `seed`

## Options By Topic

### Aspect ratio support explicitly documented

- Gemini image: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
- Gemini 3.1 Flash extras: `1:4`, `4:1`, `1:8`, `8:1`
- Kling text-to-video: `16:9`, `9:16`, `1:1`, `4:3`, `3:4`, `3:2`, `2:3`
- Seedance size presets: `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `21:9` with model-specific support
- Runway ratio examples: `16:9`, `9:16`, `1:1`
- Veo uses orientation-like `size` hints such as `16x9`, `9x16`

### Resolutions and sizes explicitly documented

- OpenAI image routes: model-dependent `size`, example `1024x1024`
- Gemini image sizes: `512px`, `1K`, `2K`, `4K`
- Sora sizes: `720x1280`, `1280x720`, `1024x1792`, `1792x1024`
- Seedance exact sizes: examples include `1280x720`, `1920x1080`, `960x960`, `1080x1920`
- Flux: direct `width` and `height`

### Quality controls explicitly documented

- OpenAI image edit: `quality = high | medium | low`
- OpenAI image generation: `quality` exists, but values are model-dependent in docs
- Kling: `mode = std | pro`
- Flux: `steps` and `guidance` behave like quality/detail controls
- Gemini: `thinkingLevel = minimal | high`

### Seed and reproducibility

Explicit seed support found in docs:

- Flux image generation: `seed`

No explicit seed surfaced in the docs snippets reviewed for:

- OpenAI image generation/editing
- Gemini image generation
- Kling text-to-video/image-to-video
- Sora create video
- Veo create video
- Seedance create video
- Runway compatibility generate

### Negative prompt support

Explicit negative prompt support found in docs:

- Kling text-to-video: `negative_prompt`
- Kling image-to-video: `negative_prompt`

No explicit negative prompt surfaced in the reviewed docs for:

- OpenAI image generation/editing
- Gemini image generation
- Flux image generation
- Sora create video
- Veo create video
- Seedance create video
- Runway compatibility generate

### Reference image support

- OpenAI image edit: `image`, optional `mask`
- Flux: `image_prompt`
- Gemini: `contents.parts.inline_data`
- Sora: `input_reference`
- Veo: `input_reference`
- Seedance: `input_reference` on 2.0 family only
- Kling image-to-video: `image`, `image_tail`, `static_mask`, `dynamic_masks`

### Callback and async hooks

- Kling text-to-video: `callback_url`
- Kling image-to-video: `callback_url`
- Flux: `webhook_url`, `webhook_secret`
- Runway: `callback_url`

## Best Endpoints If You Want Control

If your goal is rich configurable controls, these are the strongest:

- Flux image: width, height, steps, seed, guidance, safety_tolerance, output_format
- Gemini image: aspectRatio, imageSize, thinkingLevel, search grounding, multi-image input
- Kling text-to-video: negative_prompt, aspect_ratio, cfg_scale, mode, duration, camera_control
- Seedance video: concrete size and ratio behavior, model-specific duration ranges
- Runway generate: ratio, style, duration, motion vectors

## Missing Capability Gaps

Things Comet docs do not seem to expose as a unified global option matrix:

- one endpoint that returns all supported options per model
- universal seed support across image and video families
- universal negative prompt support across all video providers
- one global resolution/aspect-ratio compatibility table for every model id

That means the safest implementation strategy is:

1. route by endpoint family
2. store per-family option presets
3. optionally store per-model overrides where docs are explicit
