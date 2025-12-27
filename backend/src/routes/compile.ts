import { Router, Request, Response } from 'express';

const router = Router();

const LATEX_ONLINE_URL = 'https://latexonline.cc/compile';

// POST /compile - Compile LaTeX to PDF
router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const { content } = req.body;

        if (!content || typeof content !== 'string') {
            res.status(400).json({ error: 'LaTeX content is required' });
            return;
        }

        // Proxy to latexonline.cc
        const encodedLatex = encodeURIComponent(content);
        const compileUrl = `${LATEX_ONLINE_URL}?text=${encodedLatex}`;

        const response = await fetch(compileUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/pdf',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            res.status(response.status).json({
                error: 'Compilation failed',
                details: errorText
            });
            return;
        }

        // Get the PDF as a buffer
        const pdfBuffer = await response.arrayBuffer();

        // Send as PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        console.error('Compilation error:', error);
        res.status(500).json({
            error: 'Compilation failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
