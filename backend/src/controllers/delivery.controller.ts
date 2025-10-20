// src/controllers/delivery.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { databaseService } from '../services/database.service';

export class DeliveryController {
  async getAllDeliveries(req: AuthRequest, res: Response) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      
      const where: any = {};
      if (status) {
        where.status = status;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [deliveries, totalCount] = await Promise.all([
        databaseService.prisma.delivery.findMany({
          where,
          include: {
            vehicle: {
              select: {
                id: true,
                name: true,
                type: true,
                status: true,
              },
            },
            assignedDriver: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
          skip,
          take: Number(limit),
          orderBy: {
            createdAt: 'desc',
          },
        }),
        databaseService.prisma.delivery.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: deliveries,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Get all deliveries error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch deliveries',
      });
    }
  }

  async getDeliveryById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const delivery = await databaseService.prisma.delivery.findUnique({
        where: { id },
        include: {
          vehicle: {
            include: {
              locations: {
                take: 50,
                orderBy: {
                  timestamp: 'desc',
                },
              },
            },
          },
          assignedDriver: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      });

      if (!delivery) {
        return res.status(404).json({
          success: false,
          message: 'Delivery not found',
        });
      }

      res.status(200).json({
        success: true,
        data: delivery,
      });
    } catch (error) {
      console.error('Get delivery by id error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch delivery',
      });
    }
  }

  async createDelivery(req: AuthRequest, res: Response) {
    try {
      const {
        vehicleId,
        assignedDriverId,
        scheduledDeparture,
        scheduledArrival,
        cargoDescription,
      } = req.body;

      // Validate required fields
      if (!vehicleId || !cargoDescription) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle ID and cargo description are required',
        });
      }

      // Check if vehicle exists
      const vehicle = await databaseService.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found',
        });
      }

      // Check if driver exists (if provided)
      if (assignedDriverId) {
        const driver = await databaseService.prisma.user.findUnique({
          where: { id: assignedDriverId, role: 'DRIVER' },
        });

        if (!driver) {
          return res.status(404).json({
            success: false,
            message: 'Driver not found',
          });
        }
      }

      const delivery = await databaseService.prisma.delivery.create({
        data: {
          vehicleId,
          assignedDriverId,
          scheduledDeparture: scheduledDeparture ? new Date(scheduledDeparture) : null,
          scheduledArrival: scheduledArrival ? new Date(scheduledArrival) : null,
          cargoDescription,
          status: 'PENDING',
        },
        include: {
          vehicle: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          assignedDriver: {
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
        message: 'Delivery created successfully',
        data: delivery,
      });
    } catch (error) {
      console.error('Create delivery error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create delivery',
      });
    }
  }

  async updateDelivery(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const {
        vehicleId,
        assignedDriverId,
        scheduledDeparture,
        scheduledArrival,
        actualDeparture,
        actualArrival,
        status,
        cargoDescription,
      } = req.body;

      // Check if delivery exists
      const existingDelivery = await databaseService.prisma.delivery.findUnique({
        where: { id },
      });

      if (!existingDelivery) {
        return res.status(404).json({
          success: false,
          message: 'Delivery not found',
        });
      }

      const delivery = await databaseService.prisma.delivery.update({
        where: { id },
        data: {
          ...(vehicleId && { vehicleId }),
          ...(assignedDriverId !== undefined && { assignedDriverId }),
          ...(scheduledDeparture && { scheduledDeparture: new Date(scheduledDeparture) }),
          ...(scheduledArrival && { scheduledArrival: new Date(scheduledArrival) }),
          ...(actualDeparture && { actualDeparture: new Date(actualDeparture) }),
          ...(actualArrival && { actualArrival: new Date(actualArrival) }),
          ...(status && { status }),
          ...(cargoDescription && { cargoDescription }),
        },
        include: {
          vehicle: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          assignedDriver: {
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
        message: 'Delivery updated successfully',
        data: delivery,
      });
    } catch (error) {
      console.error('Update delivery error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update delivery',
      });
    }
  }

  async getDeliveryMetrics(req: AuthRequest, res: Response) {
    try {
      const totalDeliveries = await databaseService.prisma.delivery.count();
      const completedDeliveries = await databaseService.prisma.delivery.count({
        where: { status: 'COMPLETED' },
      });
      const inProgressDeliveries = await databaseService.prisma.delivery.count({
        where: { status: 'IN_PROGRESS' },
      });
      const pendingDeliveries = await databaseService.prisma.delivery.count({
        where: { status: 'PENDING' },
      });

      // Calculate average delivery time for completed deliveries
      const completedWithTimes = await databaseService.prisma.delivery.findMany({
        where: {
          status: 'COMPLETED',
          actualDeparture: { not: null },
          actualArrival: { not: null },
        },
        select: {
          actualDeparture: true,
          actualArrival: true,
        },
      });

      const totalDeliveryTime = completedWithTimes.reduce((total, delivery) => {
        if (delivery.actualDeparture && delivery.actualArrival) {
          const duration = delivery.actualArrival.getTime() - delivery.actualDeparture.getTime();
          return total + duration;
        }
        return total;
      }, 0);

      const averageDeliveryTime = completedWithTimes.length > 0 
        ? totalDeliveryTime / completedWithTimes.length 
        : 0;

      const metrics = {
        totalDeliveries,
        completedDeliveries,
        inProgressDeliveries,
        pendingDeliveries,
        completionRate: totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0,
        averageDeliveryTime: Math.round(averageDeliveryTime / (1000 * 60)), // Convert to minutes
      };

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error('Get delivery metrics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch delivery metrics',
      });
    }
  }
}

export const deliveryController = new DeliveryController();