# Titan Project Dashboard

Open `index.html` in any browser to view your project dashboard.

## How it works
- The dashboard reads `data/project-state.json` on page load
- Code Titan only ever updates `project-state.json` — the HTML/CSS/JS are never modified
- If the data gets out of sync, run `python sync.py` (if available) to rebuild from brain files

## Files
- `index.html` — Dashboard page (pre-built, never regenerated)
- `assets/styles.css` — Stylesheet (pre-built)
- `assets/dashboard.js` — Client-side renderer (reads project-state.json)
- `data/project-state.json` — The ONLY file that gets updated
