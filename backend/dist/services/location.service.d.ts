import * as grpc from '@grpc/grpc-js';
export declare class LocationService {
    updateLocation(call: any, callback: any): Promise<any>;
    streamLocations(call: any): Promise<void>;
    healthCheck(call: any, callback: any): Promise<void>;
    private checkGeofenceAlerts;
}
export declare function startGrpcServer(port?: number): grpc.Server;
//# sourceMappingURL=location.service.d.ts.map