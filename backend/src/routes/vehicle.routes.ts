// src/routes/vehicle.routes.ts
import { Router } from 'express';
import { vehicleController } from '../controllers/vehicle.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all vehicles
router.get('/', vehicleController.getAllVehicles);

// Get vehicle by ID
router.get('/:id', vehicleController.getVehicleById);

// Get vehicle locations
router.get('/:id/locations', vehicleController.getVehicleLocations);

// Get vehicle statistics
router.get('/:id/stats', vehicleController.getVehicleStats);

// Create vehicle (Admin/Coordinator only)
router.post('/', requireRole(['ADMIN', 'COORDINATOR']), vehicleController.createVehicle);

// Update vehicle (Admin/Coordinator only)
router.put('/:id', requireRole(['ADMIN', 'COORDINATOR']), vehicleController.updateVehicle);

export default router;