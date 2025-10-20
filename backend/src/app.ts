// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

class EthioSafeguardApp {
  public app: express.Application;
  public httpServer: any;
  public io: SocketServer;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketServer(this.httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true
    }));
    
    // Performance middleware
    this.app.use(compression());
    this.app.use(morgan('combined'));
    
    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  // --- UPDATED initializeRoutes METHOD ---
  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
      });
    });

    // Import routes
    import vehicleRoutes from './routes/vehicle.routes';
    import deliveryRoutes from './routes/delivery.routes';
    import authRoutes from './routes/auth.routes';

    // API routes
    this.app.use('/api/v1/vehicles', vehicleRoutes);
    this.app.use('/api/v1/deliveries', deliveryRoutes);
    this.app.use('/api/v1/auth', authRoutes);

    // API documentation endpoint
    this.app.get('/api', (req, res) => {
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
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
      });
    });

    // Global error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Global error handler:', error);
      
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  }

  public start(port: number = 3000): void {
    this.httpServer.listen(port, () => {
      console.log(`
🚀 ETHIO Safeguard Server Started!
📍 Port: ${port}
🌍 Environment: ${process.env.NODE_ENV}
📅 Started at: ${new Date().toISOString()}
      `);
    });
  }
}

export default EthioSafeguardApp;
