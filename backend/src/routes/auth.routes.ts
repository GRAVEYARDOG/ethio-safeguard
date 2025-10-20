// src/routes/auth.routes.ts
import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Protected routes
router.get('/me', authenticateToken, authController.getCurrentUser);
router.put('/change-password', authenticateToken, authController.changePassword);

// Admin only routes
router.get('/users', authenticateToken, requireRole(['ADMIN']), authController.getUsers);

export default router;