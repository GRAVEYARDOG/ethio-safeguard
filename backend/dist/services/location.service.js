"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationService = void 0;
exports.startGrpcServer = startGrpcServer;
// src/services/location.service.ts
const grpc = __importStar(require("@grpc/grpc-js"));
const protoLoader = __importStar(require("@grpc/proto-loader"));
const database_service_1 = require("./database.service");
const server_1 = require("../server");
const PROTO_PATH = __dirname + '/../proto/location_service.proto';
// Load proto file
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const locationProto = protoDescriptor.ethiosafeguard;
class LocationService {
    async updateLocation(call, callback) {
        try {
            const { vehicle_id, latitude, longitude, accuracy, altitude, speed, timestamp } = call.request;
            console.log(`📍 Location update received for vehicle: ${vehicle_id}`);
            // Validate vehicle exists
            const vehicle = await database_service_1.databaseService.prisma.vehicle.findUnique({
                where: { id: vehicle_id }
            });
            if (!vehicle) {
                return callback({
                    code: grpc.status.NOT_FOUND,
                    message: `Vehicle with ID ${vehicle_id} not found`
                });
            }
            // Store location in database
            const location = await database_service_1.databaseService.prisma.location.create({
                data: {
                    vehicleId: vehicle_id,
                    latitude,
                    longitude,
                    accuracy,
                    altitude,
                    speed,
                    timestamp: new Date(timestamp),
                }
            });
            // Broadcast to connected dashboard clients
            server_1.io.emit('location:update', {
                vehicleId: vehicle_id,
                location: {
                    latitude,
                    longitude,
                    accuracy,
                    speed,
                    timestamp: new Date().toISOString()
                },
                vehicle: {
                    id: vehicle.id,
                    name: vehicle.name,
                    type: vehicle.type,
                    status: vehicle.status
                }
            });
            // Check for geofence alerts (to be implemented later)
            await this.checkGeofenceAlerts(vehicle_id, latitude, longitude);
            callback(null, {
                success: true,
                message: 'Location updated successfully',
                server_time: new Date().toISOString(),
                server_id: process.env.SERVER_ID || 'default'
            });
        }
        catch (error) {
            console.error('Error updating location:', error);
            callback({
                code: grpc.status.INTERNAL,
                message: 'Internal server error while updating location'
            });
        }
    }
    async streamLocations(call) {
        console.log('🔄 Starting location stream');
        call.on('data', (locationUpdate) => {
            this.updateLocation({ request: locationUpdate }, (error, response) => {
                if (error) {
                    console.error('Stream location update error:', error);
                    call.write({
                        success: false,
                        message: error.message,
                        server_time: new Date().toISOString()
                    });
                }
                else {
                    call.write(response);
                }
            });
        });
        call.on('end', () => {
            console.log('🔚 Location stream ended');
            call.end();
        });
        call.on('error', (error) => {
            console.error('Location stream error:', error);
        });
    }
    async healthCheck(call, callback) {
        const dbHealthy = await database_service_1.databaseService.healthCheck();
        callback(null, {
            healthy: dbHealthy,
            status: dbHealthy ? 'SERVING' : 'NOT_SERVING',
            timestamp: new Date().toISOString()
        });
    }
    async checkGeofenceAlerts(vehicleId, latitude, longitude) {
        // TODO: Implement geofence checking logic
        // This will check if the vehicle has entered or exited any predefined geofences
        console.log(`🔍 Checking geofences for vehicle ${vehicleId} at (${latitude}, ${longitude})`);
    }
}
exports.LocationService = LocationService;
function startGrpcServer(port = 50051) {
    const server = new grpc.Server();
    const locationService = new LocationService();
    server.addService(locationProto.LocationService.service, {
        updateLocation: locationService.updateLocation.bind(locationService),
        streamLocations: locationService.streamLocations.bind(locationService),
        healthCheck: locationService.healthCheck.bind(locationService),
    });
    server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (error, port) => {
        if (error) {
            console.error('❌ Failed to start gRPC server:', error);
            return;
        }
        console.log(`✅ gRPC server running on port ${port}`);
        server.start();
    });
    return server;
}
//# sourceMappingURL=location.service.js.map