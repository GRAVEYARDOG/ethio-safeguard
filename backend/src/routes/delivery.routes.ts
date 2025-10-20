// src/routes/delivery.routes.ts
import { Router } from 'express';
import { deliveryController } from '../controllers/delivery.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all deliveries
router.get('/', deliveryController.getAllDeliveries);

// Get delivery by ID
router.get('/:id', deliveryController.getDeliveryById);

// Get delivery metrics
router.get('/metrics/overview', deliveryController.getDeliveryMetrics);

// Create delivery (Admin/Coordinator only)
router.post('/', requireRole(['ADMIN', 'COORDINATOR']), deliveryController.createDelivery);

// Update delivery (Admin/Coordinator only)
router.put('/:id', requireRole(['ADMIN', 'COORDINATOR']), deliveryController.updateDelivery);

export default router;