import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = express.Router();

// Schema for adding a collaborator
const addCollaboratorSchema = z.object({
    email: z.string().email(),
    role: z.enum(['viewer', 'editor']).default('editor'),
});

// Get all collaborators for a project
router.get('/projects/:id/collaborators', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.userId;

        // Check if user has access to the project
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                OR: [
                    { ownerId: userId },
                    { collaborators: { some: { userId } } }
                ]
            },
            include: {
                collaborators: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            }
                        }
                    }
                },
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Format collaborators response
        const collaborators = project.collaborators.map(collab => ({
            id: collab.id,
            role: collab.role,
            user: collab.user,
            createdAt: collab.createdAt,
        }));

        // Include owner as a collaborator with 'owner' role
        const ownerAsCollaborator = {
            id: 'owner',
            role: 'owner',
            user: project.owner,
            createdAt: project.createdAt,
        };

        res.json({
            collaborators: [ownerAsCollaborator, ...collaborators]
        });
    } catch (error) {
        console.error('Error fetching collaborators:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add a collaborator to a project
router.post('/projects/:id/collaborators', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.userId;
        const { email, role } = addCollaboratorSchema.parse(req.body);

        // Check if user is the project owner
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                ownerId: userId,
            }
        });

        if (!project) {
            return res.status(403).json({ error: 'Only project owners can add collaborators' });
        }

        // Find the user to add as collaborator
        const userToAdd = await prisma.user.findUnique({
            where: { email }
        });

        if (!userToAdd) {
            return res.status(404).json({ error: 'User with this email not found' });
        }

        if (userToAdd.id === userId) {
            return res.status(400).json({ error: 'Cannot add yourself as a collaborator' });
        }

        // Check if user is already a collaborator
        const existingCollaborator = await prisma.collaborator.findFirst({
            where: {
                projectId,
                userId: userToAdd.id,
            }
        });

        if (existingCollaborator) {
            return res.status(400).json({ error: 'User is already a collaborator' });
        }

        // Add the collaborator
        const collaborator = await prisma.collaborator.create({
            data: {
                projectId,
                userId: userToAdd.id,
                role,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });

        res.status(201).json(collaborator);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Error adding collaborator:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update collaborator role
router.put('/projects/:id/collaborators/:collaboratorId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const projectId = req.params.id;
        const collaboratorId = req.params.collaboratorId;
        const userId = req.userId;
        const { role } = z.object({
            role: z.enum(['viewer', 'editor']),
        }).parse(req.body);

        // Check if user is the project owner
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                ownerId: userId,
            }
        });

        if (!project) {
            return res.status(403).json({ error: 'Only project owners can update collaborator roles' });
        }

        // Update the collaborator
        const collaborator = await prisma.collaborator.update({
            where: {
                id: collaboratorId,
                projectId,
            },
            data: { role },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });

        if (!collaborator) {
            return res.status(404).json({ error: 'Collaborator not found' });
        }

        res.json(collaborator);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Error updating collaborator:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove a collaborator from a project
router.delete('/projects/:id/collaborators/:collaboratorId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const projectId = req.params.id;
        const collaboratorId = req.params.collaboratorId;
        const userId = req.userId;

        // Check if user is the project owner or the collaborator themselves
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                OR: [
                    { ownerId: userId },
                    { collaborators: { some: { id: collaboratorId, userId } } }
                ]
            }
        });

        if (!project) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Delete the collaborator
        const collaborator = await prisma.collaborator.delete({
            where: {
                id: collaboratorId,
                projectId,
            }
        });

        res.json({ message: 'Collaborator removed successfully' });
    } catch (error) {
        console.error('Error removing collaborator:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search for users by email or name (for adding collaborators)
router.get('/users/search', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const query = req.query.q as string;
        const currentUserId = req.userId;

        if (!query || query.length < 2) {
            return res.json({ users: [] });
        }

        const users = await prisma.user.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { email: { contains: query, mode: 'insensitive' } }
                        ]
                    },
                    { id: { not: currentUserId } } // Exclude current user
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
            take: 10, // Limit results
        });

        res.json({ users });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
