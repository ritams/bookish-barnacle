import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export interface CompileRequest {
    projectId: string;
    targetFile: string; // Path of .tex file to compile (e.g., "main.tex" or "chapters/intro.tex")
    cleanCompile?: boolean; // If true, delete cache and compile from scratch
}

export interface CompileResult {
    success: boolean;
    pdf?: Buffer;
    log: string;
    errors?: string[];
}

/**
 * Compiles a LaTeX project using local pdflatex.
 * 
 * Flow:
 * 1. Fetch all files from the project (including folders structure)
 * 2. Create/reuse a cache directory for this project
 * 3. Write all files (decode base64 for binary files like images)
 * 4. Run pdflatex on the target file
 * 5. Read the output PDF
 * 6. Keep cache for next compilation (unless cleanCompile)
 */
export async function compileProject(request: CompileRequest): Promise<CompileResult> {
    const { projectId, targetFile, cleanCompile = false } = request;

    // Use persistent cache directory per project instead of random temp
    const cacheDir = path.join(os.tmpdir(), 'latex-cache', projectId);

    try {
        // If cleanCompile, delete the entire cache directory first
        if (cleanCompile) {
            try {
                await fs.rm(cacheDir, { recursive: true, force: true });
                console.log(`[Compile] Clean compile: deleted cache for project ${projectId}`);
            } catch {
                // Cache might not exist, that's fine
            }
        }

        // Create cache directory if it doesn't exist
        await fs.mkdir(cacheDir, { recursive: true });

        // 1. Fetch all files from the project
        const files = await prisma.file.findMany({
            where: { projectId },
            select: {
                path: true,
                content: true,
                mimeType: true,
                name: true
            }
        });

        // Also fetch folders to ensure directory structure exists
        const folders = await prisma.folder.findMany({
            where: { projectId },
            select: { path: true }
        });

        if (files.length === 0) {
            return {
                success: false,
                log: 'No files found in project'
            };
        }

        // Helper to sanitize paths
        const sanitizePath = (p: string) => p.replace(/^[\/\\]+/, '');

        // Verify target file exists (check both exact match and sanitized match)
        const sanitizedTargetFile = sanitizePath(targetFile);
        const targetExists = files.some(f => sanitizePath(f.path) === sanitizedTargetFile);

        if (!targetExists) {
            const availableFiles = files.map(f => `"${f.path}"`).join(', ');
            return {
                success: false,
                log: `Target file "${targetFile}" not found in project. Available files: ${availableFiles}`
            };
        }

        // 2. Create temp directory
        await fs.mkdir(cacheDir, { recursive: true });

        // 3. Create folder structure
        for (const folder of folders) {
            const folderPath = path.join(cacheDir, sanitizePath(folder.path));
            await fs.mkdir(folderPath, { recursive: true });
        }

        // 4. Write all files
        for (const file of files) {
            const filePath = path.join(cacheDir, sanitizePath(file.path));
            const dirPath = path.dirname(filePath);

            // Ensure parent directory exists
            await fs.mkdir(dirPath, { recursive: true });

            // Check if content is base64 encoded (binary file)
            if (file.content && file.content.startsWith('data:')) {
                // Extract base64 data after the comma
                const base64Data = file.content.split(',')[1];
                if (base64Data) {
                    const binaryData = Buffer.from(base64Data, 'base64');
                    await fs.writeFile(filePath, binaryData);
                }
            } else if (file.content !== null) {
                // Text file
                await fs.writeFile(filePath, file.content, 'utf8');
            }
        }

        // 5. Run compilation sequence
        const targetBaseName = path.basename(sanitizedTargetFile, '.tex');
        const targetDir = path.dirname(sanitizedTargetFile);
        const workingDir = targetDir === '.' ? cacheDir : path.join(cacheDir, targetDir);

        // Check for .bib files to determine if we need bibtex
        const hasBibFiles = files.some(f => f.path.endsWith('.bib') || f.name.endsWith('.bib'));

        // Step 5a: Run pdflatex (first pass)
        // Note: we pass sanitizedTargetFile
        let compileResult = await runPdflatex(cacheDir, sanitizedTargetFile, workingDir);

        if (compileResult.success && hasBibFiles) {
            // Step 5b: Run bibtex
            // We need to run bibtex on the base name (without .tex extension)
            // BibTeX typically expects the .aux file to be present
            const bibtexResult = await runBibtex(cacheDir, targetBaseName, workingDir);

            if (bibtexResult.success) {
                // Step 5c: Run pdflatex (second pass)
                compileResult = await runPdflatex(cacheDir, sanitizedTargetFile, workingDir);

                // Step 5d: Run pdflatex (third pass) if needed
                if (compileResult.success &&
                    (compileResult.log.includes('Rerun to get cross-references right') ||
                        compileResult.log.includes('Label(s) may have changed'))) {
                    compileResult = await runPdflatex(cacheDir, sanitizedTargetFile, workingDir);
                }
            } else {
                // If bibtex fails, we might just log it and continue, but usually it's fatal for citations
                console.warn('BibTeX failed:', bibtexResult.log);
                compileResult.log += `\n\nBibTeX Log:\n${bibtexResult.log}`;
            }
        } else if (compileResult.success) {
            // No bib files, check if we need a second pass
            if (compileResult.log.includes('Rerun to get cross-references right') ||
                compileResult.log.includes('Label(s) may have changed')) {
                compileResult = await runPdflatex(cacheDir, sanitizedTargetFile, workingDir);
            }
        }

        if (!compileResult.success) {
            return compileResult;
        }

        // 6. Read the output PDF
        const pdfPath = path.join(cacheDir, `${targetBaseName}.pdf`);

        try {
            const pdfBuffer = await fs.readFile(pdfPath);
            return {
                success: true,
                pdf: pdfBuffer,
                log: compileResult.log
            };
        } catch {
            // PDF might be in the working directory if target was in a subdirectory
            const altPdfPath = path.join(workingDir, `${targetBaseName}.pdf`);
            try {
                const pdfBuffer = await fs.readFile(altPdfPath);
                return {
                    success: true,
                    pdf: pdfBuffer,
                    log: compileResult.log
                };
            } catch {
                return {
                    success: false,
                    log: compileResult.log + '\n\nPDF file was not generated.',
                    errors: ['PDF file not found after compilation']
                };
            }
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
            success: false,
            log: `Compilation error: ${errorMessage}`,
            errors: [errorMessage]
        };
    } finally {
        // Only delete PDF file so it gets regenerated next compilation
        // Keep aux, toc, log, bbl files for faster subsequent compiles
        // Note: We don't delete the cache directory anymore to enable caching
    }
}

/**
 * Runs a command in the temp directory
 */
async function runCommand(
    command: string,
    args: string[],
    cwd: string,
    env?: NodeJS.ProcessEnv
): Promise<{ success: boolean; log: string }> {
    return new Promise((resolve) => {
        const process = spawn(command, args, { cwd, env });

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => { stdout += data.toString(); });
        process.stderr.on('data', (data) => { stderr += data.toString(); });

        process.on('close', (code) => {
            const fullLog = stdout + (stderr ? `\n\nStderr:\n${stderr}` : '');

            if (code === 0) {
                resolve({ success: true, log: fullLog });
            } else {
                // Extract error messages from log for better UX
                // Look for lines starting with ! or containing Error:
                // Also capture the line context (2 lines) for the error
                const lines = stdout.split('\n');
                let errorLog = '';

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line.startsWith('!') || line.includes('Error:')) {
                        // Capture this line and next 2 lines
                        errorLog += line + '\n';
                        if (i + 1 < lines.length) errorLog += lines[i + 1] + '\n';
                        if (i + 2 < lines.length) errorLog += lines[i + 2] + '\n';
                        errorLog += '\n'; // Separator
                    }
                }

                // If no specific errors found, return the tail of the log
                if (!errorLog) {
                    errorLog = 'Log tail:\n' + lines.slice(-20).join('\n');
                }

                resolve({ success: false, log: errorLog || fullLog });
            }
        });

        process.on('error', (err) => {
            resolve({
                success: false,
                log: `Failed to start ${command}: ${err.message}`
            });
        });

        setTimeout(() => {
            process.kill();
            resolve({ success: false, log: 'Command timed out after 60 seconds' });
        }, 60000);
    });
}

/**
 * Runs pdflatex
 */
async function runPdflatex(
    tempDir: string,
    targetFile: string,
    workingDir: string
): Promise<{ success: boolean; log: string }> {
    return runCommand('pdflatex', [
        '-interaction=nonstopmode',
        '-halt-on-error',
        `-output-directory=${tempDir}`,
        targetFile
    ], tempDir, {
        ...globalThis.process.env,
        TEXINPUTS: `${tempDir}:${workingDir}:`,
    });
}

/**
 * Runs bibtex
 */
async function runBibtex(
    tempDir: string,
    targetBaseName: string,
    workingDir: string
): Promise<{ success: boolean; log: string }> {
    return runCommand('bibtex', [
        targetBaseName
    ], tempDir, { // BibTeX runs in the directory where .aux files are (tempDir due to -output-directory)
        ...globalThis.process.env,
        TEXINPUTS: `${tempDir}:${workingDir}:`,
        BSTINPUTS: `${tempDir}:${workingDir}:`, // Search path for .bst files
        BIBINPUTS: `${tempDir}:${workingDir}:`, // Search path for .bib files
    });
}
