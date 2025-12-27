# LaTeX Studio

An AI-native LaTeX compiling web application with **client-side compilation**, similar to Overleaf but running entirely in your browser.

## Features

- 📝 **LaTeX Editor** - CodeMirror 6 with syntax highlighting, auto-completion, and bracket matching
- 📁 **File Manager** - Tree-based file navigation with create/delete support
- 📄 **PDF Viewer** - Built-in PDF preview with zoom and page navigation
- ⚡ **Client-Side Compilation** - LaTeX compiled in browser using WebAssembly (SwiftLaTeX integration pending)
- 🎨 **Modern UI** - Beautiful Catppuccin Mocha dark theme with resizable panels

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite |
| Editor | CodeMirror 6 + codemirror-lang-latex |
| PDF | pdf.js |
| State | Zustand |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt |

## Project Structure

```
bookish-barnacle/
├── frontend/           # React + Vite application
│   └── src/
│       ├── components/ # Editor, FileManager, PDFViewer
│       ├── stores/     # Zustand state management
│       └── App.tsx     # Main layout
│
└── backend/            # Express.js API server
    ├── src/
    │   ├── routes/     # Auth, Projects, Files API
    │   └── middleware/ # JWT authentication
    └── prisma/         # Database schema
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (for backend)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Backend

```bash
cd backend
npm install

# Configure database
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Generate Prisma client and push schema
npm run db:generate
npm run db:push

# Start server
npm run dev
```

API runs at http://localhost:3001

## Development Status

| Feature | Status |
|---------|--------|
| LaTeX Editor | ✅ Complete |
| File Manager | ✅ Complete |
| PDF Viewer | ✅ Complete |
| Backend API | ✅ Complete |
| Database Schema | ✅ Complete |
| Client-side LaTeX compilation | 🚧 Pending (SwiftLaTeX) |
| Authentication UI | 🚧 Pending |
| Real-time collaboration | 📋 Planned |
| AI features | 📋 Planned |

## License

MIT
