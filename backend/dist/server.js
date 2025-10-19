"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
// src/server.ts
const app_1 = __importDefault(require("./app"));
const database_service_1 = require("./services/database.service");
const location_service_1 = require("./services/location.service");
const app = new app_1.default();
const PORT = parseInt(process.env.PORT || '3000');
const GRPC_PORT = parseInt(process.env.GRPC_PORT || '50051');
// Export io for use in services (like LocationService)
exports.io = app.io;
// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
    console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);
    try {
        await database_service_1.databaseService.disconnect();
        console.log('✅ All services stopped gracefully');
        process.exit(0);
    }
    catch (error) {
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
        await database_service_1.databaseService.connect();
        // Start gRPC server
        (0, location_service_1.startGrpcServer)(GRPC_PORT);
        // Start HTTP server
        app.start(PORT);
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
// Start the server
startServer();
//# sourceMappingURL=server.js.map