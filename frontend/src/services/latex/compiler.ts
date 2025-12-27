// LaTeX compilation service
// Uses backend API to compile (which proxies to latexonline.cc)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Compile LaTeX to PDF via backend API
export const compileLatex = async (
    mainFile: string,
    files: { path: string; content: string }[]
): Promise<{ success: boolean; pdf?: Blob; log: string }> => {
    try {
        // Filter out binary files (base64 encoded images)
        const textFiles = files.filter(f => !f.content.startsWith('data:'));

        // Find the main file, or fall back to first .tex file
        const targetFile = textFiles.find(f => f.path === mainFile) ||
            textFiles.find(f => f.path.endsWith('.tex'));
        const mainContent = targetFile?.content || '';

        if (!mainContent) {
            return { success: false, log: 'No .tex file found' };
        }

        const response = await fetch(`${API_BASE_URL}/compile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: mainContent }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                log: `Compilation failed: ${response.status} ${response.statusText}\n${errorData.details || errorData.error || ''}`
            };
        }

        const pdfBlob = await response.blob();

        if (pdfBlob.size === 0) {
            return { success: false, log: 'Compilation produced no output' };
        }

        return { success: true, pdf: pdfBlob, log: 'Compilation successful' };
    } catch (error) {
        return {
            success: false,
            log: `Compilation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
};

// Initialize engine (no-op for API-based compilation)
export const initLatexEngine = async (): Promise<void> => {
    return Promise.resolve();
};

// Close engine (no-op for API-based compilation)
export const closeLatexEngine = (): void => { };

// Engine is always ready for API-based compilation
export const isEngineReady = (): boolean => true;
