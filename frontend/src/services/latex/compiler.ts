// LaTeX compilation service
// Uses backend API to compile with local pdflatex

import { api } from '../api';

// Compile LaTeX to PDF via backend API
export const compileLatex = async (
    projectId: string,
    targetFile: string // Path to the .tex file to compile
): Promise<{ success: boolean; pdf?: Blob; log: string }> => {
    try {
        if (!projectId) {
            return { success: false, log: 'No project ID provided' };
        }

        if (!targetFile) {
            return { success: false, log: 'No target file specified' };
        }

        const result = await api.compile.compile(projectId, targetFile);

        if (result.pdf && result.pdf.size > 0) {
            return { success: true, pdf: result.pdf, log: 'Compilation successful' };
        } else {
            return { success: false, log: 'Compilation produced no output' };
        }
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
