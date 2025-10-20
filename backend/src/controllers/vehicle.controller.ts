// src/controllers/vehicle.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { databaseService } from '../services/database.service';

export class VehicleController {
  async getAllVehicles(req: AuthRequest, res: Response) {
    try {
      const vehicles = await databaseService.prisma.vehicle.findMany({
        include: {
          currentDriver: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          },
          locations: {
            take: 1,
            orderBy: {
              timestamp: 'desc',
            },
          },
          deliveries: {
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
            where: {
              status: 'IN_PROGRESS',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transform data to include last known location
      const vehiclesWithLastLocation = vehicles.map(vehicle => {
        const lastLocation = vehicle.locations[0] || null;
        const currentDelivery = vehicle.deliveries[0] || null;
        
        const { locations, deliveries, ...vehicleData } = vehicle;
        
        return {
          ...vehicleData,
          lastLocation,
          currentDelivery,
        };
      });

      res.status(200).json({
        success: true,
        data: vehiclesWithLastLocation,
        count: vehicles.length,
      });
    } catch (error) {
      console.error('Get all vehicles error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicles',
      });
    }
  }

  async getVehicleById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const vehicle = await databaseService.prisma.vehicle.findUnique({
        where: { id },
        include: {
          currentDriver: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          },
          locations: {
            take: 100,
            orderBy: {
              timestamp: 'desc',
            },
          },
          deliveries: {
            take: 10,
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              assignedDriver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found',
        });
      }

      res.status(200).json({
        success: true,
        data: vehicle,
      });
    } catch (error) {
      console.error('Get vehicle by id error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle',
      });
    }
  }

  async createVehicle(req: AuthRequest, res: Response) {
    try {
      const { name, type, status, currentDriverId } = req.body;

      // Validate required fields
      if (!name || !type) {
        return res.status(400).json({
          success: false,
          message: 'Name and type are required fields',
        });
      }

      const vehicle = await databaseService.prisma.vehicle.create({
        data: {
          name,
          type,
          status: status || 'ACTIVE',
          currentDriverId: currentDriverId || null,
        },
        include: {
          currentDriver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Vehicle created successfully',
        data: vehicle,
      });
    } catch (error) {
      console.error('Create vehicle error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create vehicle',
      });
    }
  }

  async updateVehicle(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, type, status, currentDriverId } = req.body;

      // Check if vehicle exists
      const existingVehicle = await databaseService.prisma.vehicle.findUnique({
        where: { id },
      });

      if (!existingVehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found',
        });
      }

      const vehicle = await databaseService.prisma.vehicle.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(type && { type }),
          ...(status && { status }),
          ...(currentDriverId !== undefined && { currentDriverId }),
        },
        include: {
          currentDriver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        message: 'Vehicle updated successfully',
        data: vehicle,
      });
    } catch (error) {
      console.error('Update vehicle error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update vehicle',
      });
    }
  }

  async getVehicleLocations(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { startDate, endDate, limit = 100 } = req.query;

      // Build where clause for date filtering
      let where: any = { vehicleId: id };

      if (startDate && endDate) {
        where.timestamp = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        };
      }

      const locations = await databaseService.prisma.location.findMany({
        where,
        take: Number(limit),
        orderBy: {
          timestamp: 'desc',
        },
      });

      res.status(200).json({
        success: true,
        data: locations,
        count: locations.length,
      });
    } catch (error) {
      console.error('Get vehicle locations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle locations',
      });
    }
  }

  async getVehicleStats(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const vehicle = await databaseService.prisma.vehicle.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              locations: true,
              deliveries: true,
            },
          },
          deliveries: {
            take: 5,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found',
        });
      }

      // Calculate additional stats
      const completedDeliveries = await databaseService.prisma.delivery.count({
        where: {
          vehicleId: id,
          status: 'COMPLETED',
        },
      });

      const stats = {
        totalLocations: vehicle._count.locations,
        totalDeliveries: vehicle._count.deliveries,
        completedDeliveries,
        completionRate: vehicle._count.deliveries > 0 
          ? (completedDeliveries / vehicle._count.deliveries) * 100 
          : 0,
        recentDeliveries: vehicle.deliveries,
      };

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get vehicle stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle statistics',
      });
    }
  }
}

export const vehicleController = new VehicleController();