// src/server.ts
import EthioSafeguardApp from './app';
import { databaseService } from './services/database.service';
import { startGrpcServer } from './services/location.service';

const app = new EthioSafeguardApp();
const PORT = parseInt(process.env.PORT || '3000');
const GRPC_PORT = parseInt(process.env.GRPC_PORT || '50051');

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);
  
  try {
    await databaseService.disconnect();
    console.log('✅ All services stopped gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Signal handlers
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Initialize and start the application
const startServer = async () => {
  try {
    // Connect to database
    await databaseService.connect();
    
    // Start gRPC server
    startGrpcServer(GRPC_PORT);
    
    // Start HTTP server
    app.start(PORT);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();