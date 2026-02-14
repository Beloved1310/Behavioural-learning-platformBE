import { Request, Response } from 'express';
export declare class PaymentController {
    static getPaymentHistory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getPaymentStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createPaymentIntent: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static confirmPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getSubscription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createSubscription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateSubscription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static cancelSubscription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getPaymentMethods: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static addPaymentMethod: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deletePaymentMethod: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static setDefaultPaymentMethod: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static requestRefund: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getRefundRequests: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static processRefund: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=paymentController.d.ts.map