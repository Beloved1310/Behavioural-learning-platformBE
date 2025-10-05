import { Server } from 'socket.io';
export declare const setupSocketIO: (io: Server) => Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare const sendNotificationToUser: (io: Server, userId: string, notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
}) => Promise<void>;
//# sourceMappingURL=index.d.ts.map