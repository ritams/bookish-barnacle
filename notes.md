# Development Notes

## Known Limitations

### PDF Storage in localStorage
- PDFs are stored as base64 in localStorage after compilation
- Browser localStorage typically has a 5-10MB limit
- Very large PDFs may hit this limit and fail to persist
- **Future improvement**: Use IndexedDB for larger storage capacity

## Architecture Decisions

### LaTeX Compilation
- Initially attempted client-side WASM compilation (SwiftLaTeX, texlive.js)
- CDN sources were unreliable/unavailable
- Switched to backend proxy approach: Frontend → Backend `/compile` → latexonline.cc
- This avoids CORS issues and provides reliable compilation

### PDF.js Worker
- pdfjs-dist v5.x uses `.mjs` worker files (not `.js`)
- Worker loaded from unpkg CDN: `https://unpkg.com/pdfjs-dist@5.4.449/build/pdf.worker.min.mjs`
