import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        _id: string;
        role: string;
    };
}
export declare class PaymentController {
    static getPaymentHistory(req: AuthRequest, res: Response): Promise<void>;
    static getPaymentStats(req: AuthRequest, res: Response): Promise<void>;
    static createPaymentIntent(req: AuthRequest, res: Response): Promise<void>;
    static confirmPayment(req: AuthRequest, res: Response): Promise<void>;
    static getSubscription(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static createSubscription(req: AuthRequest, res: Response): Promise<void>;
    static updateSubscription(req: AuthRequest, res: Response): Promise<void>;
    static cancelSubscription(req: AuthRequest, res: Response): Promise<void>;
    static getPaymentMethods(req: AuthRequest, res: Response): Promise<void>;
    static addPaymentMethod(req: AuthRequest, res: Response): Promise<void>;
    static deletePaymentMethod(req: AuthRequest, res: Response): Promise<void>;
    static setDefaultPaymentMethod(req: AuthRequest, res: Response): Promise<void>;
    static requestRefund(req: AuthRequest, res: Response): Promise<void>;
    static getRefundRequests(req: AuthRequest, res: Response): Promise<void>;
    static processRefund(req: AuthRequest, res: Response): Promise<void>;
}
export {};
//# sourceMappingURL=paymentController.d.ts.map