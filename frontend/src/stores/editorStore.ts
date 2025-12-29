import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';

export interface File {
    id: string;
    path: string;
    name: string;
    content: string | null; // null = not loaded (lazy loading)
    mimeType: string;
    isLoaded?: boolean;
}

export interface Folder {
    id: string;
    path: string;
    name: string;
}

interface Project {
    id: string;
    name: string;
    description?: string;
    mainFile: string;
    files: File[];
}

interface EditorState {
    // Project state
    currentProject: Project | null;
    currentFile: File | null;
    files: File[];
    folders: Folder[];
    activeDirectory: string; // Currently expanded/active folder path

    // Editor state
    isCompiling: boolean;
    compilationError: string | null;
    pdfUrl: string | null;
    pdfBase64: string | null; // Store PDF as base64 for persistence

    // Save state
    isSaving: boolean;
    lastSaveError: string | null;

    // Loading state
    isLoadingContent: boolean;

    // Actions
    setCurrentProject: (project: Project | null) => void;
    setCurrentFile: (file: File | null) => void;
    setFiles: (files: File[]) => void;
    setFolders: (folders: Folder[]) => void;
    setActiveDirectory: (path: string) => void;
    updateFileContent: (fileId: string, content: string) => void;
    setIsCompiling: (isCompiling: boolean) => void;
    setCompilationError: (error: string | null) => void;
    setPdfUrl: (url: string | null) => void;
    setPdfBase64: (base64: string | null) => void;
    addFile: (file: File) => void;
    removeFile: (fileId: string) => void;
    addFolder: (folder: Folder) => void;
    removeFolder: (folderId: string) => void;
    saveCurrentFile: () => Promise<boolean>;
    loadFileContent: (fileId: string) => Promise<void>;
    moveFile: (fileId: string, newPath: string) => Promise<void>;
    renameFile: (fileId: string, newName: string) => Promise<void>;
}

// Default sample file
const defaultFiles: File[] = [
    {
        id: 'main-tex',
        path: 'main.tex',
        name: 'main.tex',
        content: `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{graphicx}

\\title{My LaTeX Document}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
Welcome to your LaTeX document! This editor supports:
\\begin{itemize}
  \\item Syntax highlighting
  \\item Auto-completion
  \\item Multi-file compilation
\\end{itemize}

\\section{Mathematics}
Here's an example equation:
\\begin{equation}
  E = mc^2
\\end{equation}

And an inline equation: $\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$

\\section{Conclusion}
Start editing to see your changes!

\\end{document}
`,
        mimeType: 'text/x-tex',
        isLoaded: true,
    },
];

export const useEditorStore = create<EditorState>()(
    persist(
        (set, get) => ({
            // Initial state
            currentProject: null,
            currentFile: null,
            files: defaultFiles,
            folders: [],
            activeDirectory: '',
            isCompiling: false,
            compilationError: null,
            pdfUrl: null,
            pdfBase64: null,
            isSaving: false,
            lastSaveError: null,
            isLoadingContent: false,

            // Actions
            setCurrentProject: (project) => set({ currentProject: project }),
            setCurrentFile: (file) => set({ currentFile: file }),
            setFiles: (files) => set({ files }),
            setFolders: (folders) => set({ folders }),
            setActiveDirectory: (path) => set({ activeDirectory: path }),
            updateFileContent: (fileId, content) =>
                set((state) => ({
                    files: state.files.map((f) =>
                        f.id === fileId ? { ...f, content, isLoaded: true } : f
                    ),
                    currentFile:
                        state.currentFile?.id === fileId
                            ? { ...state.currentFile, content, isLoaded: true }
                            : state.currentFile,
                })),
            setIsCompiling: (isCompiling) => set({ isCompiling }),
            setCompilationError: (error) => set({ compilationError: error }),
            setPdfUrl: (url) => set({ pdfUrl: url }),
            setPdfBase64: (base64) => set({ pdfBase64: base64 }),
            addFile: (file) =>
                set((state) => ({ files: [...state.files, file] })),
            removeFile: (fileId) =>
                set((state) => ({
                    files: state.files.filter((f) => f.id !== fileId),
                    currentFile:
                        state.currentFile?.id === fileId ? null : state.currentFile,
                })),
            addFolder: (folder) =>
                set((state) => ({ folders: [...state.folders, folder] })),
            removeFolder: (folderId) =>
                set((state) => ({
                    folders: state.folders.filter((f) => f.id !== folderId),
                })),
            saveCurrentFile: async () => {
                const { currentFile, isSaving } = get();
                if (!currentFile || isSaving) return false;

                // Skip saving for default/temporary files (they don't exist in DB)
                if (currentFile.id === 'main-tex') return true;

                set({ isSaving: true, lastSaveError: null });

                try {
                    await api.files.update(currentFile.id, {
                        content: currentFile.content || '',
                    });
                    set({ isSaving: false });
                    return true;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to save';
                    set({ isSaving: false, lastSaveError: errorMessage });
                    return false;
                }
            },
            loadFileContent: async (fileId: string) => {
                const { files } = get();
                const file = files.find(f => f.id === fileId);

                if (!file || file.isLoaded) return;

                set({ isLoadingContent: true });

                try {
                    const response = await api.files.getContent(fileId);
                    set((state) => ({
                        files: state.files.map((f) =>
                            f.id === fileId
                                ? { ...f, content: response.data.content, isLoaded: true }
                                : f
                        ),
                        currentFile:
                            state.currentFile?.id === fileId
                                ? { ...state.currentFile, content: response.data.content, isLoaded: true }
                                : state.currentFile,
                        isLoadingContent: false,
                    }));
                } catch (error) {
                    console.error('Failed to load file content:', error);
                    set({ isLoadingContent: false });
                }
            },
            moveFile: async (fileId: string, newPath: string) => {
                try {
                    const response = await api.files.move(fileId, newPath);
                    set((state) => ({
                        files: state.files.map((f) =>
                            f.id === fileId
                                ? { ...f, path: response.data.path, name: response.data.name }
                                : f
                        ),
                        currentFile:
                            state.currentFile?.id === fileId
                                ? { ...state.currentFile, path: response.data.path, name: response.data.name }
                                : state.currentFile,
                    }));
                } catch (error) {
                    console.error('Failed to move file:', error);
                    throw error;
                }
            },
            renameFile: async (fileId: string, newName: string) => {
                try {
                    const response = await api.files.rename(fileId, newName);
                    set((state) => ({
                        files: state.files.map((f) =>
                            f.id === fileId
                                ? { ...f, path: response.data.path, name: response.data.name }
                                : f
                        ),
                        currentFile:
                            state.currentFile?.id === fileId
                                ? { ...state.currentFile, path: response.data.path, name: response.data.name }
                                : state.currentFile,
                    }));
                } catch (error) {
                    console.error('Failed to rename file:', error);
                    throw error;
                }
            },
        }),
        {
            name: 'latex-editor-storage',
            partialize: (state) => ({
                files: state.files,
                currentFile: state.currentFile,
                pdfBase64: state.pdfBase64,
            }),
        }
    )
);
