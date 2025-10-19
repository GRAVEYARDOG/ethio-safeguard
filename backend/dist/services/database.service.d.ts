import { PrismaClient } from '@prisma/client';
declare class DatabaseService {
    private static instance;
    prisma: PrismaClient;
    private constructor();
    static getInstance(): DatabaseService;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<boolean>;
}
export declare const databaseService: DatabaseService;
export {};
//# sourceMappingURL=database.service.d.ts.map