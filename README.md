# CV Studio

A fast, no‑login CV builder that lets users import their existing CV or supporting documents, refine content in a structured editor, switch between templates, and export a pixel‑matched PDF.

## Highlights
- No account required — everything is stored in **localStorage**.
- Upload CV + supporting docs (`PDF`, `DOCX`, `TXT`) and a profile photo.
- Auto‑prefill content from uploads (light parsing + heuristics).
- AI improvement **stub** (placeholder until a backend is wired).
- Multiple templates, including **single‑column** and **right‑sidebar** layouts.
- Live template switching while editing.
- Final red‑flag checks (gaps, missing contact, missing metrics).
- One‑click PDF export that matches the on‑screen template.

## Tech Stack
- React + Vite
- `pdfjs-dist` (PDF text extraction)
- `mammoth` (DOCX text extraction)
- `html2canvas` + `jspdf` (pixel‑matched PDF export)

## Getting Started
```bash
npm install
npm run dev
```

Build and preview:
```bash
npm run build
npm run preview
```

## How It Works
1. **Upload inputs**: CV + supporting documents are parsed into plain text.
2. **Prefill**: key sections are auto‑filled from the extracted text.
3. **Edit**: fully editable sections with add/remove fields.
4. **Template switch**: change templates at any time without losing data.
5. **Red‑flag check**: detects common recruiter concerns.
6. **Export**: generate a PDF that matches the on‑screen layout.

## Templates
Included template styles:
- **Classic / Modern / Minimal**: left sidebar, clean two‑column layouts.
- **Studio / Slate / Coast**: varied typography and color direction.
- **Reverse**: right‑sidebar two‑column layout.
- **Actor**: single‑column, centered, editorial layout.

## Local Storage
All data is saved locally in the browser. This keeps the app privacy‑first, but:
- Very large files may exceed localStorage limits.
- Multi‑page CVs or heavy files should eventually be handled with backend storage.

To clear local data, use the **“Clear Local Data”** button in the UI.

## Limitations (Current)
- LinkedIn import is stubbed. Use a LinkedIn PDF export or paste profile text into a TXT file.
- PDF export is a single A4 page. Multi‑page export can be added next.
- AI improvement is a placeholder and does not call a real model yet.

## Project Structure
```
/Users/marco/Desktop/CV Tool
  ├─ src/
  │  ├─ App.jsx
  │  ├─ main.jsx
  │  └─ styles.css
  ├─ index.html
  ├─ vite.config.js
  └─ package.json
```

## Roadmap Ideas
- Real AI integration (prompted improvements + structured extraction)
- Multi‑page PDF export
- Import from LinkedIn via API or OAuth
- Cloud sync / saved drafts

---
If you want the README tailored for open‑source contribution or deployment (Netlify/Vercel), tell me and I’ll extend it.
