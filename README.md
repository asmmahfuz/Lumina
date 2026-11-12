# Lumina Reader

A high-performance, distraction-free **Universal Digital Reading Suite** built with **Rust (Tauri 2.0)**, **React 19**, and **TypeScript**.

Lumina Reader provides a clean, unified experience for reading and organizing digital books, comics, and documents across desktop and modern web environments.

---

## Features

- **Universal Format Support**:
  - **EPUB**: Sandboxed reflowable & fixed rendering, CFI-based progress tracking, dual-page view.
  - **PDF & DJVU**: High-performance canvas rendering with thumbnail navigation and page search.
  - **Comics & Manga (CBZ / CBR)**: Image streaming, double-page spreads, Right-to-Left manga mode, and vertical webtoon scrolling.
- **Editorial Typography**: Customizable fonts, line spacing, margins, color themes (Light, Sepia, Dark, OLED), and zen reading mode.
- **Local-First & Private**: Books, annotations, reading progress, and bookmarks stay 100% on your machine.
- **Desktop & Web**: Runs natively via Tauri 2.0 on desktop (with local SQLite persistence) and gracefully supports web deployment with IndexedDB.

---

## Tech Stack

- **Desktop Framework**: [Tauri v2](https://v2.tauri.app/) (Rust)
- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Document Engines**: `pdfjs-dist`, `djvu-rs`, `jszip`
- **Icons**: `lucide-react`

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [Rust & Cargo](https://rustup.rs/) (only required for desktop Tauri builds)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd "Epub Reader"

# Install dependencies
npm install
```

### Development

```bash
# Run web version in browser
npm run dev

# Run desktop app via Tauri
npm run tauri dev
```

### Production Build

```bash
# Build frontend web bundle
npm run build

# Build standalone desktop installer / binary
npm run tauri build
```

---

## Project Structure

```
├── public/           # Static public assets, service worker, WASM binaries
├── scripts/          # Build and audit utility scripts
├── src/              # React frontend application
│   ├── app/          # Core layout, provider, and lifecycle hooks
│   ├── components/   # Reader views, library, UI components
│   ├── services/     # Format parsers (epub, pdf, djvu, comic) & storage
│   ├── styles/       # Design tokens, themes, global CSS
│   └── types/        # TypeScript type definitions
├── src-tauri/        # Rust backend (Tauri 2 application & SQLite storage)
└── index.html        # Web entry point
```

---

## License

Private / Proprietary. All rights reserved.
