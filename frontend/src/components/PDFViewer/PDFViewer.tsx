import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';

// Configure PDF.js worker for version 5.x
pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.449/build/pdf.worker.min.mjs';

export function PDFViewer() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { pdfUrl, isCompiling, compilationError } = useEditorStore();
    const [scale, setScale] = useState(1.2);
    const [totalPages, setTotalPages] = useState(0);
    const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
    const [renderedPages, setRenderedPages] = useState<HTMLCanvasElement[]>([]);

    useEffect(() => {
        if (!pdfUrl) return;

        const loadPdf = async () => {
            try {
                const doc = await pdfjs.getDocument(pdfUrl).promise;
                setPdfDoc(doc);
                setTotalPages(doc.numPages);
            } catch (error) {
                console.error('Failed to load PDF:', error);
            }
        };

        loadPdf();

        return () => {
            pdfDoc?.destroy();
        };
    }, [pdfUrl]);

    // Render all pages when PDF loads or scale changes
    useEffect(() => {
        if (!pdfDoc) return;

        const renderAllPages = async () => {
            const canvases: HTMLCanvasElement[] = [];

            for (let i = 1; i <= pdfDoc.numPages; i++) {
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale });

                // Account for device pixel ratio for crisp rendering
                const dpr = window.devicePixelRatio || 1;
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d')!;

                // Set canvas size accounting for DPR
                canvas.height = viewport.height * dpr;
                canvas.width = viewport.width * dpr;

                // Scale canvas via CSS to display at correct size
                canvas.style.width = `${viewport.width}px`;
                canvas.style.height = `${viewport.height}px`;
                canvas.className = 'shadow-xl rounded flex-shrink-0';

                // Scale context to match DPR
                context.scale(dpr, dpr);

                await page.render({
                    canvasContext: context,
                    viewport,
                    canvas: canvas,
                }).promise;

                canvases.push(canvas);
            }

            setRenderedPages(canvases);
        };

        renderAllPages();
    }, [pdfDoc, scale]);

    // Append canvases to container
    useEffect(() => {
        if (!containerRef.current || renderedPages.length === 0) return;

        // Clear existing pages
        containerRef.current.innerHTML = '';

        // Append all pages
        renderedPages.forEach((canvas) => {
            containerRef.current!.appendChild(canvas);
        });
    }, [renderedPages]);

    const handleZoomIn = () => setScale((s) => Math.min(s + 0.2, 3));
    const handleZoomOut = () => setScale((s) => Math.max(s - 0.2, 0.4));

    if (isCompiling) {
        return (
            <div className="flex flex-col h-full bg-olive-100 overflow-hidden">
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-olive-600">
                    <Loader2 size={32} className="animate-spin" />
                    <span>Compiling LaTeX...</span>
                </div>
            </div>
        );
    }

    if (compilationError) {
        return (
            <div className="flex flex-col h-full bg-olive-100 overflow-hidden">
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <h3 className="text-red-600 font-semibold mb-4 text-lg">Compilation Error</h3>
                    <pre className="max-w-full p-4 bg-white rounded-lg text-left overflow-x-auto text-sm text-amber-700 font-mono border border-olive-200">
                        {compilationError}
                    </pre>
                </div>
            </div>
        );
    }

    if (!pdfUrl) {
        return (
            <div className="flex flex-col h-full bg-olive-100 overflow-hidden">
                <div className="flex-1 flex flex-col items-center justify-center text-olive-400">
                    <p className="text-sm">Click "Compile" to generate PDF</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-olive-100 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-center gap-6 px-4 py-2 bg-white border-b border-olive-200">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleZoomOut}
                        title="Zoom Out"
                        className="flex items-center justify-center w-8 h-8 border border-olive-200 rounded-md text-olive-700 hover:bg-olive-50 transition-colors"
                    >
                        <ZoomOut size={18} />
                    </button>
                    <span className="min-w-[60px] text-center text-sm text-olive-600">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={handleZoomIn}
                        title="Zoom In"
                        className="flex items-center justify-center w-8 h-8 border border-olive-200 rounded-md text-olive-700 hover:bg-olive-50 transition-colors"
                    >
                        <ZoomIn size={18} />
                    </button>
                </div>
                <span className="text-sm text-olive-500">
                    {totalPages} page{totalPages !== 1 ? 's' : ''}
                </span>
            </div>

            {/* PDF Container */}
            <div
                ref={containerRef}
                className="flex-1 min-h-0 flex flex-col items-center gap-4 p-6 overflow-y-auto"
            />
        </div>
    );
}
