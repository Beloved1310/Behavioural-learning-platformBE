import Joi from 'joi';
export declare const createPaymentIntentSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const confirmPaymentSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const getPaymentsSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const getPaymentByIdSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const refundPaymentSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const getPaymentMethodsSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const addPaymentMethodSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const updatePaymentMethodSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const deletePaymentMethodSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const getPaymentStatsSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const processSubscriptionPaymentSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const cancelSubscriptionSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const getSubscriptionSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const applyDiscountSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const createDiscountSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const getInvoicesSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const downloadInvoiceSchema: {
    params: Joi.ObjectSchema<any>;
    query: Joi.ObjectSchema<any>;
};
export declare const processPayoutSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const getPayoutHistorySchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const handleWebhookSchema: {
    body: Joi.ObjectSchema<any>;
};
//# sourceMappingURL=payment.d.ts.map