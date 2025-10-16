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

    // API routes will be added here
    this.app.use('/api/v1/vehicles', () => {}); // TODO: Add vehicle routes
    this.app.use('/api/v1/deliveries', () => {}); // TODO: Add delivery routes
    this.app.use('/api/v1/auth', () => {}); // TODO: Add auth routes
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
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