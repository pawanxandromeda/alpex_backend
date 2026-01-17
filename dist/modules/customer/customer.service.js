"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.updateCustomer = exports.getCustomerGSTList = exports.getAllCustomers = exports.loginCustomer = exports.createCustomer = void 0;
const postgres_1 = __importDefault(require("../../config/postgres"));
const createCustomer = async (data) => {
    const existing = await postgres_1.default.customer.findUnique({
        where: { gstrNo: data.gstrNo },
    });
    if (existing) {
        throw new Error("Customer with this GST already exists");
    }
    return postgres_1.default.customer.create({ data });
};
exports.createCustomer = createCustomer;
const loginCustomer = async (gstrNo, customerID) => {
    const customer = await postgres_1.default.customer.findFirst({
        where: { gstrNo, customerID },
    });
    if (!customer)
        throw new Error("Customer not found");
    return customer;
};
exports.loginCustomer = loginCustomer;
const getAllCustomers = async () => {
    return postgres_1.default.customer.findMany();
};
exports.getAllCustomers = getAllCustomers;
const getCustomerGSTList = async () => {
    return postgres_1.default.customer.findMany({
        select: {
            gstrNo: true,
            kycProfile: true,
            customerName: true,
        },
    });
};
exports.getCustomerGSTList = getCustomerGSTList;
const updateCustomer = async (id, data) => {
    return postgres_1.default.customer.update({
        where: { id },
        data,
    });
};
exports.updateCustomer = updateCustomer;
const deleteCustomer = async (id) => {
    return postgres_1.default.customer.delete({
        where: { id },
    });
};
exports.deleteCustomer = deleteCustomer;
