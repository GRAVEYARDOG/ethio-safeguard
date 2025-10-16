// src/services/location.service.ts
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { databaseService } from './database.service';
import { io } from '../server';

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
const locationProto = protoDescriptor.ethiosafeguard as any;

export class LocationService {
  async updateLocation(call: any, callback: any) {
    try {
      const { vehicle_id, latitude, longitude, accuracy, altitude, speed, timestamp } = call.request;
      
      console.log(`📍 Location update received for vehicle: ${vehicle_id}`);

      // Validate vehicle exists
      const vehicle = await databaseService.prisma.vehicle.findUnique({
        where: { id: vehicle_id }
      });

      if (!vehicle) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: `Vehicle with ID ${vehicle_id} not found`
        });
      }

      // Store location in database
      const location = await databaseService.prisma.location.create({
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
      io.emit('location:update', {
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

    } catch (error) {
      console.error('Error updating location:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error while updating location'
      });
    }
  }

  async streamLocations(call: any) {
    console.log('🔄 Starting location stream');
    
    call.on('data', (locationUpdate: any) => {
      this.updateLocation(
        { request: locationUpdate },
        (error: any, response: any) => {
          if (error) {
            console.error('Stream location update error:', error);
            call.write({
              success: false,
              message: error.message,
              server_time: new Date().toISOString()
            });
          } else {
            call.write(response);
          }
        }
      );
    });

    call.on('end', () => {
      console.log('🔚 Location stream ended');
      call.end();
    });

    call.on('error', (error: any) => {
      console.error('Location stream error:', error);
    });
  }

  async healthCheck(call: any, callback: any) {
    const dbHealthy = await databaseService.healthCheck();
    
    callback(null, {
      healthy: dbHealthy,
      status: dbHealthy ? 'SERVING' : 'NOT_SERVING',
      timestamp: new Date().toISOString()
    });
  }

  private async checkGeofenceAlerts(vehicleId: string, latitude: number, longitude: number) {
    // TODO: Implement geofence checking logic
    // This will check if the vehicle has entered or exited any predefined geofences
    console.log(`🔍 Checking geofences for vehicle ${vehicleId} at (${latitude}, ${longitude})`);
  }
}

export function startGrpcServer(port: number = 50051) {
  const server = new grpc.Server();
  const locationService = new LocationService();

  server.addService(locationProto.LocationService.service, {
    updateLocation: locationService.updateLocation.bind(locationService),
    streamLocations: locationService.streamLocations.bind(locationService),
    healthCheck: locationService.healthCheck.bind(locationService),
  });

  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error('❌ Failed to start gRPC server:', error);
        return;
      }
      console.log(`✅ gRPC server running on port ${port}`);
      server.start();
    }
  );

  return server;
}