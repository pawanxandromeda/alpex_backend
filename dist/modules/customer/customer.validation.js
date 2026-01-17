"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomerSchema = exports.createCustomerSchema = void 0;
const zod_1 = require("zod");
exports.createCustomerSchema = zod_1.z.object({
    customerID: zod_1.z.string().min(1),
    customerName: zod_1.z.string().min(2),
    address: zod_1.z.string().min(5),
    creditLimit: zod_1.z.number().positive(),
    paymentTerms: zod_1.z.string(),
    throughVia: zod_1.z.string(),
    gstrNo: zod_1.z.string().length(15),
    kycProfile: zod_1.z.string(),
    contactName: zod_1.z.string(),
    contactPhone: zod_1.z.string().length(10),
    contactEmail: zod_1.z.string().email().optional(),
    remarks: zod_1.z.string().optional(),
    relationshipStatus: zod_1.z.string().optional(),
    gstCopy: zod_1.z.string().optional(),
    dlExpiry: zod_1.z.string().datetime().optional(),
});
exports.updateCustomerSchema = exports.createCustomerSchema.partial();
