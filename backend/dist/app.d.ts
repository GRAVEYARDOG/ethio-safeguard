import express from 'express';
import { Server as SocketServer } from 'socket.io';
declare class EthioSafeguardApp {
    app: express.Application;
    httpServer: any;
    io: SocketServer;
    constructor();
    private initializeMiddleware;
    private initializeRoutes;
    private initializeErrorHandling;
    start(port?: number): void;
}
export default EthioSafeguardApp;
//# sourceMappingURL=app.d.ts.map