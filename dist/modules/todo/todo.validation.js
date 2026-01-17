"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.todoIdSchema = exports.getTodosSchema = exports.createTodoSchema = void 0;
const zod_1 = require("zod");
// Create Todo
exports.createTodoSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, "Title is required"),
        username: zod_1.z.string().min(1, "Username is required"),
    }),
});
// Get Todos by username
exports.getTodosSchema = zod_1.z.object({
    query: zod_1.z.object({
        username: zod_1.z.string().min(1, "Username is required"),
    }),
});
// Complete/Delete Todo by ID
exports.todoIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Todo ID"),
    }),
});
