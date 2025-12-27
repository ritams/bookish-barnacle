import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authMiddleware);

// Validation schemas
const createProjectSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional()
});

const updateProjectSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    mainFile: z.string().optional()
});

// GET /projects - List user's projects
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { ownerId: req.userId },
                    { collaborators: { some: { userId: req.userId } } }
                ]
            },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                _count: { select: { files: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json(projects);
    } catch (error) {
        console.error('List projects error:', error);
        res.status(500).json({ error: 'Failed to list projects' });
    }
});

// POST /projects - Create new project
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, description } = createProjectSchema.parse(req.body);

        const project = await prisma.project.create({
            data: {
                name,
                description,
                ownerId: req.userId!,
                files: {
                    create: {
                        path: 'main.tex',
                        name: 'main.tex',
                        content: `\\documentclass{article}
\\usepackage[utf8]{inputenc}

\\title{${name}}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
Start writing your document here.

\\end{document}
`,
                        mimeType: 'text/x-tex'
                    }
                }
            },
            include: {
                files: true,
                owner: { select: { id: true, name: true, email: true } }
            }
        });

        res.status(201).json({
            ...project,
            files: project.files.map(f => ({
                ...f,
                size: f.size.toString()
            }))
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// GET /projects/:id - Get project details
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const project = await prisma.project.findFirst({
            where: {
                id: req.params.id,
                OR: [
                    { ownerId: req.userId },
                    { collaborators: { some: { userId: req.userId } } }
                ]
            },
            include: {
                files: { orderBy: { path: 'asc' } },
                owner: { select: { id: true, name: true, email: true } },
                collaborators: {
                    include: { user: { select: { id: true, name: true, email: true } } }
                }
            }
        });

        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        res.json({
            ...project,
            files: project.files.map(f => ({
                ...f,
                size: f.size.toString()
            }))
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Failed to get project' });
    }
});

// PUT /projects/:id - Update project
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = updateProjectSchema.parse(req.body);

        // Check ownership
        const project = await prisma.project.findFirst({
            where: { id: req.params.id, ownerId: req.userId }
        });

        if (!project) {
            res.status(404).json({ error: 'Project not found or access denied' });
            return;
        }

        const updated = await prisma.project.update({
            where: { id: req.params.id },
            data,
            include: { files: true }
        });

        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// DELETE /projects/:id - Delete project
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Check ownership
        const project = await prisma.project.findFirst({
            where: { id: req.params.id, ownerId: req.userId }
        });

        if (!project) {
            res.status(404).json({ error: 'Project not found or access denied' });
            return;
        }

        await prisma.project.delete({ where: { id: req.params.id } });

        res.json({ message: 'Project deleted' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

export default router;
