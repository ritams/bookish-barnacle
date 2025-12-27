import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authMiddleware);

// Validation schemas
const createFileSchema = z.object({
    projectId: z.string().uuid(),
    path: z.string().min(1),
    name: z.string().min(1),
    content: z.string().default(''),
    mimeType: z.string().default('text/x-tex')
});

const updateFileSchema = z.object({
    content: z.string().optional(),
    path: z.string().optional(),
    name: z.string().optional()
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

// GET /files/:id - Get file by ID
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const file = await prisma.file.findUnique({
            where: { id: req.params.id },
            include: { project: { select: { id: true, ownerId: true } } }
        });

        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        // Check access
        const hasAccess = await checkProjectAccess(file.projectId, req.userId!);
        if (!hasAccess) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        res.json({
            ...file,
            size: file.size.toString()
        });
    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ error: 'Failed to get file' });
    }
});

// POST /files - Create new file
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { projectId, path, name, content, mimeType } = createFileSchema.parse(req.body);

        // Check access
        const hasAccess = await checkProjectAccess(projectId, req.userId!);
        if (!hasAccess) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Check if file exists
        const existingFile = await prisma.file.findFirst({
            where: { projectId, path }
        });

        if (existingFile) {
            res.status(400).json({ error: 'File already exists at this path' });
            return;
        }

        const file = await prisma.file.create({
            data: {
                projectId,
                path,
                name,
                content,
                mimeType,
                size: BigInt(Buffer.byteLength(content, 'utf8'))
            }
        });

        res.status(201).json({
            ...file,
            size: file.size.toString()
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Create file error:', error);
        res.status(500).json({ error: 'Failed to create file' });
    }
});

// PUT /files/:id - Update file
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = updateFileSchema.parse(req.body);

        const file = await prisma.file.findUnique({
            where: { id: req.params.id }
        });

        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        // Check access
        const hasAccess = await checkProjectAccess(file.projectId, req.userId!);
        if (!hasAccess) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const updateData: Record<string, unknown> = { ...data };
        if (data.content !== undefined) {
            updateData.size = BigInt(Buffer.byteLength(data.content, 'utf8'));
        }

        const updated = await prisma.file.update({
            where: { id: req.params.id },
            data: updateData
        });

        res.json({
            ...updated,
            size: updated.size.toString()
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Update file error:', error);
        res.status(500).json({ error: 'Failed to update file' });
    }
});

// DELETE /files/:id - Delete file
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const file = await prisma.file.findUnique({
            where: { id: req.params.id }
        });

        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        // Check access
        const hasAccess = await checkProjectAccess(file.projectId, req.userId!);
        if (!hasAccess) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        await prisma.file.delete({ where: { id: req.params.id } });

        res.json({ message: 'File deleted' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

export default router;
