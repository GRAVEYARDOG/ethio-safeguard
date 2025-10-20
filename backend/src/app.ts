// src/app.ts
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { databaseService } from './services/database.service';

// Import route modules
import vehicleRoutes from './routes/vehicle.routes';
import deliveryRoutes from './routes/delivery.routes';
import authRoutes from './routes/auth.routes';

dotenv.config();

export class App {
  public app: Application;
  public port: string | number;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5000;

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.connectDatabase();
  }

  private initializeMiddlewares(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(morgan('dev'));
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
      });
    });

    // Mount API routes
    this.app.use('/api/v1/vehicles', vehicleRoutes);
    this.app.use('/api/v1/deliveries', deliveryRoutes);
    this.app.use('/api/v1/auth', authRoutes);

    // API documentation overview
    this.app.get('/api', (req: Request, res: Response) => {
      res.json({
        message: 'ETHIO Safeguard API',
        version: '1.0.0',
        endpoints: {
          auth: '/api/v1/auth',
          vehicles: '/api/v1/vehicles',
          deliveries: '/api/v1/deliveries',
        },
        documentation: '/api/docs' // TODO: Add Swagger documentation
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ success: false, message: 'Endpoint not found' });
    });

    // General error handler
    this.app.use((err: any, req: Request, res: Response, next: Function) => {
      console.error('Server error:', err);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
      });
    });
  }

  private async connectDatabase(): Promise<void> {
    try {
      await databaseService.prisma.$connect();
      console.log('Connected to database successfully');
    } catch (error) {
      console.error('Database connection error:', error);
    }
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }
}

// Start the application
const appInstance = new App();
appInstance.listen();
