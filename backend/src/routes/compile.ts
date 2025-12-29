import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { compileProject } from '../services/compileService.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Require authentication for compilation
router.use(authMiddleware);

// Validation schema
const compileSchema = z.object({
    projectId: z.string().uuid(),
    targetFile: z.string().min(1).default('main.tex'),
    cleanCompile: z.boolean().optional().default(false)
});

// Helper to check project access
async function checkProjectAccess(projectId: string, userId: string): Promise<boolean> {
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            OR: [
                { ownerId: userId },
                { collaborators: { some: { userId } } }
            ]
        }
    });
    return !!project;
}

// POST /compile - Compile LaTeX to PDF using local pdflatex
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { projectId, targetFile, cleanCompile } = compileSchema.parse(req.body);

        // Check access
        const hasAccess = await checkProjectAccess(projectId, req.userId!);
        if (!hasAccess) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        console.log(`Compiling project ${projectId}, target: ${targetFile}, clean: ${cleanCompile}`);

        const result = await compileProject({ projectId, targetFile, cleanCompile });

        if (result.success && result.pdf) {
            // Send PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
            res.send(result.pdf);
        } else {
            // Send error with log
            res.status(400).json({
                error: 'Compilation failed',
                log: result.log,
                errors: result.errors
            });
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Compilation error:', error);
        res.status(500).json({
            error: 'Compilation failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
