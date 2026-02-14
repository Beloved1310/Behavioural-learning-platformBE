declare class Database {
    private static instance;
    private constructor();
    static getInstance(): Database;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
}
declare const databaseInstance: Database;
export declare const connectDB: () => Promise<void>;
export declare const disconnectDB: () => Promise<void>;
export default databaseInstance;
//# sourceMappingURL=database.d.ts.map