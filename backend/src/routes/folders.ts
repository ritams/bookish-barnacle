import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authMiddleware);

// Validation schemas
const createFolderSchema = z.object({
    projectId: z.string().uuid(),
    path: z.string().min(1),
    name: z.string().min(1)
});

const updateFolderSchema = z.object({
    path: z.string().min(1).optional(),
    name: z.string().min(1).optional()
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

// GET /folders/project/:projectId - List all folders in a project
router.get('/project/:projectId', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params;

        // Check access
        const hasAccess = await checkProjectAccess(projectId, req.userId!);
        if (!hasAccess) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const folders = await prisma.folder.findMany({
            where: { projectId },
            orderBy: { path: 'asc' }
        });

        res.json(folders);
    } catch (error) {
        console.error('List folders error:', error);
        res.status(500).json({ error: 'Failed to list folders' });
    }
});

// POST /folders - Create new folder
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { projectId, path, name } = createFolderSchema.parse(req.body);

        // Check access
        const hasAccess = await checkProjectAccess(projectId, req.userId!);
        if (!hasAccess) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Check if folder already exists
        const existingFolder = await prisma.folder.findFirst({
            where: { projectId, path }
        });

        if (existingFolder) {
            res.status(400).json({ error: 'Folder already exists at this path' });
            return;
        }

        // Create parent folders if needed
        const pathParts = path.split('/');
        for (let i = 0; i < pathParts.length - 1; i++) {
            const parentPath = pathParts.slice(0, i + 1).join('/');
            const parentName = pathParts[i];

            await prisma.folder.upsert({
                where: {
                    projectId_path: { projectId, path: parentPath }
                },
                create: {
                    projectId,
                    path: parentPath,
                    name: parentName
                },
                update: {} // No-op if exists
            });
        }

        const folder = await prisma.folder.create({
            data: {
                projectId,
                path,
                name
            }
        });

        res.status(201).json(folder);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Create folder error:', error);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

// PUT /folders/:id - Update folder (rename/move)
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = updateFolderSchema.parse(req.body);

        const folder = await prisma.folder.findUnique({
            where: { id: req.params.id }
        });

        if (!folder) {
            res.status(404).json({ error: 'Folder not found' });
            return;
        }

        // Check access
        const hasAccess = await checkProjectAccess(folder.projectId, req.userId!);
        if (!hasAccess) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const oldPath = folder.path;
        const newPath = data.path || oldPath;

        // If path is changing, update all child folders and files
        if (data.path && data.path !== oldPath) {
            // Update child folders
            const childFolders = await prisma.folder.findMany({
                where: {
                    projectId: folder.projectId,
                    path: { startsWith: `${oldPath}/` }
                }
            });

            for (const child of childFolders) {
                const newChildPath = child.path.replace(oldPath, newPath);
                await prisma.folder.update({
                    where: { id: child.id },
                    data: { path: newChildPath }
                });
            }

            // Update child files
            const childFiles = await prisma.file.findMany({
                where: {
                    projectId: folder.projectId,
                    path: { startsWith: `${oldPath}/` }
                }
            });

            for (const file of childFiles) {
                const newFilePath = file.path.replace(oldPath, newPath);
                await prisma.file.update({
                    where: { id: file.id },
                    data: { path: newFilePath }
                });
            }
        }

        const updated = await prisma.folder.update({
            where: { id: req.params.id },
            data: {
                path: newPath,
                name: data.name || folder.name
            }
        });

        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Update folder error:', error);
        res.status(500).json({ error: 'Failed to update folder' });
    }
});

// DELETE /folders/:id - Delete folder (and all contents)
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const folder = await prisma.folder.findUnique({
            where: { id: req.params.id }
        });

        if (!folder) {
            res.status(404).json({ error: 'Folder not found' });
            return;
        }

        // Check access
        const hasAccess = await checkProjectAccess(folder.projectId, req.userId!);
        if (!hasAccess) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Delete all child files
        await prisma.file.deleteMany({
            where: {
                projectId: folder.projectId,
                path: { startsWith: `${folder.path}/` }
            }
        });

        // Delete all child folders
        await prisma.folder.deleteMany({
            where: {
                projectId: folder.projectId,
                path: { startsWith: `${folder.path}/` }
            }
        });

        // Delete the folder itself
        await prisma.folder.delete({ where: { id: req.params.id } });

        res.json({ message: 'Folder deleted' });
    } catch (error) {
        console.error('Delete folder error:', error);
        res.status(500).json({ error: 'Failed to delete folder' });
    }
});

export default router;
