"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
class EthioSafeguardApp {
    constructor() {
        this.app = (0, express_1.default)();
        this.httpServer = (0, http_1.createServer)(this.app);
        this.io = new socket_io_1.Server(this.httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    initializeMiddleware() {
        // Security middleware
        this.app.use((0, helmet_1.default)());
        this.app.use((0, cors_1.default)({
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            credentials: true
        }));
        // Performance middleware
        this.app.use((0, compression_1.default)());
        this.app.use((0, morgan_1.default)('combined'));
        // Body parsing middleware
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true }));
    }
    initializeRoutes() {
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
        this.app.use('/api/v1/vehicles', () => { }); // TODO: Add vehicle routes
        this.app.use('/api/v1/deliveries', () => { }); // TODO: Add delivery routes
        this.app.use('/api/v1/auth', () => { }); // TODO: Add auth routes
    }
    initializeErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: `Route ${req.originalUrl} not found`
            });
        });
        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('Global error handler:', error);
            res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Internal server error',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            });
        });
    }
    start(port = 3000) {
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
exports.default = EthioSafeguardApp;
//# sourceMappingURL=app.js.map