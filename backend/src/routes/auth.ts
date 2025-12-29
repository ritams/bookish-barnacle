import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';

const router = Router();
const prisma = new PrismaClient();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuthSchema = z.object({
    credential: z.string()
});

router.post('/google', async (req: Request, res: Response): Promise<void> => {
    try {
        const { credential } = googleAuthSchema.parse(req.body);

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            res.status(400).json({ error: 'Invalid Google token' });
            return;
        }

        const { email, sub: googleId, name } = payload;

        // Find or create user
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { googleId },
                    { email }
                ]
            }
        });

        if (user) {
            // Link googleId if not linked
            if (!user.googleId) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { googleId }
                });
            }
        } else {
            // Create new user
            user = await prisma.user.create({
                data: {
                    email,
                    name: name || email.split('@')[0],
                    googleId,
                    // valid without passwordHash since it's optional now
                }
            });
        }

        // Generate session token
        const token = jwt.sign(
            { userId: user.id, email: user.email, name: user.name },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        res.json({
            user: { id: user.id, email: user.email, name: user.name },
            token
        });

    } catch (error) {
        console.error('Google auth error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
});

export default router;
