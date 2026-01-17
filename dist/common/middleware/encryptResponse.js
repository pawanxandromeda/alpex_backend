"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = "aes-256-cbc";
const SECRET_KEY = crypto_1.default
    .createHash("sha256")
    .update(process.env.RESPONSE_SECRET || "default_secret")
    .digest();
const IV = Buffer.alloc(16, 0);
const encrypt = (text) => {
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, SECRET_KEY, IV);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
};
const encryptResponse = (_, res, next) => {
    res.encryptAndSend = (data) => {
        const encrypted = encrypt(JSON.stringify(data));
        res.json({ payload: encrypted });
    };
    next();
};
exports.default = encryptResponse;
