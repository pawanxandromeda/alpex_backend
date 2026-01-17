"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const employee_routes_1 = __importDefault(require("./modules/employee/employee.routes"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const customer_routes_1 = __importDefault(require("./modules/customer/customer.routes"));
const todo_routes_1 = __importDefault(require("./modules/todo/todo.routes"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        const allowedOrigins = [
            "http://localhost:5173",
            "https://alpex-software.onrender.com",
            "https://alpex-customers.onrender.com",
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
app.use((0, helmet_1.default)());
app.use("/api/employees", employee_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
app.use("/api/customers", customer_routes_1.default);
app.use("/api/todos", todo_routes_1.default);
exports.default = app;
