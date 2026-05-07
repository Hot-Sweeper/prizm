# CometAPI Image and Video Options Reference (Docs Derived)

- Generated: 2026-05-07 21:20:45 UTC
- Source: OpenAPI specs linked from https://apidoc.cometapi.com/llms.txt
- OpenAPI files scanned: 71
- Endpoints summarized: 14

## Notes

- This file is docs-derived, not a live capability probe.
- Comet exposes multiple provider-specific endpoint families, so supported fields vary by endpoint and model.
- If a field does not show an enum here, it usually means the docs describe it textually rather than enforcing a strict OpenAPI enum.

## Option Inventory

- **action**: GET /kling/v1/{action}/{action2}/{task_id}
- **action2**: GET /kling/v1/{action}/{action2}/{task_id}
- **file_id**: GET /v1/files/retrieve
- **id**: GET /flux/v1/get_result; GET /mj/task/{id}/fetch; GET /replicate/v1/predictions/{id}; GET /runwayml/v1/tasks/{id}; GET /v1/videos/{id}
- **request_id**: GET /bria/{request_id}; GET /grok/v1/videos/{request_id}
- **task_id**: GET /kling/v1/{action}/{action2}/{task_id}; GET /kling/v1/videos/omni-video/{task_id}; GET /v1/files/retrieve; GET /v1/query/video_generation
- **variant**: GET /v1/videos/{video_id}/content
- **video_id**: GET /v1/videos/{video_id}; GET /v1/videos/{video_id}/content
- **X-Runway-Version**: GET /runwayml/v1/tasks/{id}

## Endpoint Details

### GET /bria/{request_id}

- Summary: Query Status
- Spec: https://apidoc.cometapi.com/api/openapi/image/bria/get-query-status.openapi.json

- **request_id** (`string`) required
  - [path] The request_id returned by the Bria Image Editing API

### GET /flux/v1/get_result

- Summary: flux query
- Spec: https://apidoc.cometapi.com/api/openapi/image/flux/get-flux-query.openapi.json

- **id** (`string`) required
  - [query] Task id returned by the Flux generate endpoint.

### GET /grok/v1/videos/{request_id}

- Summary: Query an xAI video job
- Spec: https://apidoc.cometapi.com/api/openapi/video/xai/get-get-video-generation-results.openapi.json

- **request_id** (`string`) required
  - [path] Deferred request id returned by the create or edit endpoint.

### GET /kling/v1/{action}/{action2}/{task_id}

- Summary: Individual queries 
- Spec: https://apidoc.cometapi.com/api/openapi/video/kling/get-individual-queries.openapi.json

- **action** (`string`) required
  - [path] Resource type. One of: `images`, `videos`, `audio`.
- **action2** (`string`) required
  - [path] Sub-action matching the resource type. For `images`: `generations`, `kolors-virtual-try-on`. For `videos`: `text2video`, `image2video`, `lip-sync`, `effects`, `multi-image2video`, `multi-elements`. For `audio`: `text-to-audio`, `video-to-audio`.
- **task_id** (`string`) required
  - [path] Task ID

### GET /kling/v1/videos/omni-video/{task_id}

- Summary: Omni Query
- Spec: https://apidoc.cometapi.com/api/openapi/video/kling/get-omni-query.openapi.json

- **task_id** (`string`) required
  - [path] Task id returned by the Omni Video endpoint.

### GET /mj/task/{id}/fetch

- Summary: Fetch a Midjourney task
- Spec: https://apidoc.cometapi.com/api/openapi/image/midjourney/task-fetching-api/get-fetch-single-task.openapi.json

- **id** (`string`) required
  - [path] Midjourney task id.

### GET /replicate/v1/predictions/{id}

- Summary: Query a Replicate prediction
- Spec: https://apidoc.cometapi.com/api/openapi/image/replicate/get-replicate-query.openapi.json

- **id** (`string`) required
  - [path] Prediction id returned by the create endpoint.

### GET /runwayml/v1/tasks/{id}

- Summary: Poll a Runway official-format task
- Spec: https://apidoc.cometapi.com/api/openapi/video/runway/official-format/get-runway-to-get-task-details.openapi.json

- **id** (`string`) required
  - [path] Runway task id returned by the create endpoint.
- **X-Runway-Version** (`string`)
  - [header] Optional Runway version header, for example `2024-11-06`.

### GET /v1/files/retrieve

- Summary: Retrieve MiniMax file metadata
- Spec: https://apidoc.cometapi.com/api/openapi/video/minimax-conch/get-minimax-conch-download.openapi.json

- **file_id** (`string`)
  - [query] MiniMax file id from the query response.
- **task_id** (`string`)
  - [query] Related task id when your workflow tracks the task instead of the file id.

### GET /v1/query/video_generation

- Summary: Query a MiniMax video task
- Spec: https://apidoc.cometapi.com/api/openapi/video/minimax-conch/get-minimax-conch-query.openapi.json

- **task_id** (`string`) required
  - [query] Task id returned by the create endpoint.

### GET /v1/videos/{id}

- Summary: Retrieve a Seedance video task
- Spec: https://apidoc.cometapi.com/api/openapi/video/seedance/get-seedance-query.openapi.json

- **id** (`string`) required
  - [path] Task id returned by POST /v1/videos.

### GET /v1/videos/{video_id}

- Summary: Retrieve a Veo video job
- Spec: https://apidoc.cometapi.com/api/openapi/video/veo3/self-developed/get-veo3-retrive.openapi.json

- **video_id** (`string`) required
  - [path] Task id returned by the create endpoint.

### GET /v1/videos/{video_id}

- Summary: Retrieve a Sora video job
- Spec: https://apidoc.cometapi.com/api/openapi/video/sora-2/official/get-retrieve-video.openapi.json

- **video_id** (`string`) required
  - [path] Video id returned by the create or remix endpoint.

### GET /v1/videos/{video_id}/content

- Summary: Download finished Sora video content
- Spec: https://apidoc.cometapi.com/api/openapi/video/sora-2/official/get-retrieve-video-content.openapi.json

- **variant** (`string`)
  - [query] Optional content variant such as the main video, thumbnail, or spritesheet when supported by the provider.
- **video_id** (`string`) required
  - [path] Completed video id.

