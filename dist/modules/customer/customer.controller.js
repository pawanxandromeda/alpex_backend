"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.updateCustomer = exports.getGSTCustomers = exports.getCustomers = exports.verifyToken = exports.loginCustomer = exports.createCustomer = void 0;
const service = __importStar(require("./customer.service"));
const customer_validation_1 = require("./customer.validation");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const createCustomer = async (req, res) => {
    try {
        const payload = customer_validation_1.createCustomerSchema.parse(req.body);
        const customer = await service.createCustomer(payload);
        res.status(201).json(customer);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.createCustomer = createCustomer;
const loginCustomer = async (req, res) => {
    try {
        const { gstrNo, customerID } = req.body;
        const customer = await service.loginCustomer(gstrNo, customerID);
        const token = jsonwebtoken_1.default.sign({ customerId: customer.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.json({ token });
    }
    catch (err) {
        res.status(401).json({ error: err.message });
    }
};
exports.loginCustomer = loginCustomer;
const verifyToken = (req, res) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(req.body.token, process.env.JWT_SECRET);
        res.json({ valid: true, decoded });
    }
    catch {
        res.status(401).json({ valid: false });
    }
};
exports.verifyToken = verifyToken;
const getCustomers = async (_, res) => {
    const customers = await service.getAllCustomers();
    res.encryptAndSend(customers);
};
exports.getCustomers = getCustomers;
const getGSTCustomers = async (_, res) => {
    res.json(await service.getCustomerGSTList());
};
exports.getGSTCustomers = getGSTCustomers;
const updateCustomer = async (req, res) => {
    const payload = customer_validation_1.updateCustomerSchema.parse(req.body);
    const customer = await service.updateCustomer(req.params.id, payload);
    res.json(customer);
};
exports.updateCustomer = updateCustomer;
const deleteCustomer = async (req, res) => {
    await service.deleteCustomer(req.params.id);
    res.json({ message: "Customer deleted successfully" });
};
exports.deleteCustomer = deleteCustomer;
