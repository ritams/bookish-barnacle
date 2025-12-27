import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import './PDFViewer.css';

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
                canvas.className = 'pdf-page';

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
            <div className="pdf-viewer">
                <div className="pdf-loading">
                    <div className="spinner" />
                    <span>Compiling LaTeX...</span>
                </div>
            </div>
        );
    }

    if (compilationError) {
        return (
            <div className="pdf-viewer">
                <div className="pdf-error">
                    <h3>Compilation Error</h3>
                    <pre>{compilationError}</pre>
                </div>
            </div>
        );
    }

    if (!pdfUrl) {
        return (
            <div className="pdf-viewer">
                <div className="pdf-placeholder">
                    <p>Click "Compile" to generate PDF</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pdf-viewer">
            <div className="pdf-toolbar">
                <div className="toolbar-group">
                    <button onClick={handleZoomOut} title="Zoom Out">
                        <ZoomOut size={18} />
                    </button>
                    <span className="zoom-level">{Math.round(scale * 100)}%</span>
                    <button onClick={handleZoomIn} title="Zoom In">
                        <ZoomIn size={18} />
                    </button>
                </div>
                <span className="page-info">{totalPages} page{totalPages !== 1 ? 's' : ''}</span>
            </div>
            <div className="pdf-container" ref={containerRef} />
        </div>
    );
}
