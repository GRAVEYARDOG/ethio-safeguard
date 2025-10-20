// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { authService } from '../services/auth.service';
import { databaseService } from '../services/database.service';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      const result = await authService.login(email, password);

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { email, password, name, role, phoneNumber } = req.body;

      if (!email || !password || !name || !role) {
        return res.status(400).json({
          success: false,
          message: 'Email, password, name, and role are required',
        });
      }

      const result = await authService.register({
        email,
        password,
        name,
        role,
        phoneNumber,
      });

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      res.status(200).json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user data',
      });
    }
  }

  async changePassword(req: AuthRequest, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required',
        });
      }

      const result = await authService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Change password error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Password change failed',
      });
    }
  }

  async getUsers(req: AuthRequest, res: Response) {
    try {
      const users = await databaseService.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phoneNumber: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
      });
    }
  }
}

export const authController = new AuthController();