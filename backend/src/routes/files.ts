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

const moveFileSchema = z.object({
    newPath: z.string().min(1)
});

const renameFileSchema = z.object({
    newName: z.string().min(1)
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

// GET /files/:id - Get file metadata (without content for lazy loading)
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const file = await prisma.file.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                projectId: true,
                path: true,
                name: true,
                mimeType: true,
                size: true,
                createdAt: true,
                updatedAt: true
            }
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
            size: file.size.toString(),
            content: null // Lazy loading - content not included
        });
    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ error: 'Failed to get file' });
    }
});

// GET /files/:id/content - Get file content (lazy load)
router.get('/:id/content', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const file = await prisma.file.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                projectId: true,
                content: true,
                mimeType: true
            }
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
            id: file.id,
            content: file.content,
            mimeType: file.mimeType
        });
    } catch (error) {
        console.error('Get file content error:', error);
        res.status(500).json({ error: 'Failed to get file content' });
    }
});

// GET /files/:id/full - Get file with content (for backwards compatibility)
router.get('/:id/full', async (req: AuthRequest, res: Response): Promise<void> => {
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

        res.json({
            ...file,
            size: file.size.toString()
        });
    } catch (error) {
        console.error('Get file full error:', error);
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

        // Calculate size - for base64 content, use the decoded size
        let size: bigint;
        if (content.startsWith('data:')) {
            const base64Data = content.split(',')[1];
            size = base64Data ? BigInt(Buffer.from(base64Data, 'base64').length) : BigInt(0);
        } else {
            size = BigInt(Buffer.byteLength(content, 'utf8'));
        }

        const file = await prisma.file.create({
            data: {
                projectId,
                path,
                name,
                content,
                mimeType,
                size
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

// PUT /files/:id - Update file content
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
            // Calculate size - for base64 content, use the decoded size
            if (data.content.startsWith('data:')) {
                const base64Data = data.content.split(',')[1];
                updateData.size = base64Data ? BigInt(Buffer.from(base64Data, 'base64').length) : BigInt(0);
            } else {
                updateData.size = BigInt(Buffer.byteLength(data.content, 'utf8'));
            }
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

// PUT /files/:id/move - Move file to new path
router.put('/:id/move', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { newPath } = moveFileSchema.parse(req.body);

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

        // Check if target path already exists
        const existingFile = await prisma.file.findFirst({
            where: { projectId: file.projectId, path: newPath }
        });

        if (existingFile) {
            res.status(400).json({ error: 'A file already exists at the target path' });
            return;
        }

        // Extract new name from path
        const newName = newPath.split('/').pop() || file.name;

        const updated = await prisma.file.update({
            where: { id: req.params.id },
            data: {
                path: newPath,
                name: newName
            }
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
        console.error('Move file error:', error);
        res.status(500).json({ error: 'Failed to move file' });
    }
});

// PUT /files/:id/rename - Rename file in place
router.put('/:id/rename', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { newName } = renameFileSchema.parse(req.body);

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

        // Build new path (same directory, new name)
        const pathParts = file.path.split('/');
        pathParts[pathParts.length - 1] = newName;
        const newPath = pathParts.join('/');

        // Check if target path already exists
        const existingFile = await prisma.file.findFirst({
            where: { projectId: file.projectId, path: newPath }
        });

        if (existingFile) {
            res.status(400).json({ error: 'A file with this name already exists' });
            return;
        }

        const updated = await prisma.file.update({
            where: { id: req.params.id },
            data: {
                path: newPath,
                name: newName
            }
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
        console.error('Rename file error:', error);
        res.status(500).json({ error: 'Failed to rename file' });
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
