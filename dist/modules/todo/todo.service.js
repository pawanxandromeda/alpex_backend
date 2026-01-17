"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTodo = exports.completeTodo = exports.getTodosByUsername = exports.createTodo = void 0;
const postgres_1 = __importDefault(require("../../config/postgres"));
const createTodo = async (title, username) => {
    return postgres_1.default.todo.create({
        data: { title, username },
    });
};
exports.createTodo = createTodo;
const getTodosByUsername = async (username) => {
    return postgres_1.default.todo.findMany({
        where: { username },
        orderBy: { createdAt: "desc" },
    });
};
exports.getTodosByUsername = getTodosByUsername;
const completeTodo = async (id) => {
    return postgres_1.default.todo.update({
        where: { id },
        data: { completed: true },
    });
};
exports.completeTodo = completeTodo;
const deleteTodo = async (id) => {
    return postgres_1.default.todo.delete({
        where: { id },
    });
};
exports.deleteTodo = deleteTodo;
