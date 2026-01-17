"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmployee = exports.updateEmployee = exports.getEmployees = exports.createEmployee = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const postgres_1 = __importDefault(require("../../config/postgres"));
const createEmployee = async (data) => {
    data.password = await bcryptjs_1.default.hash(data.password, 10);
    return postgres_1.default.employee.create({ data });
};
exports.createEmployee = createEmployee;
const getEmployees = async () => postgres_1.default.employee.findMany({
    select: { password: false, refreshToken: false },
});
exports.getEmployees = getEmployees;
const updateEmployee = async (id, data) => {
    if (data.password)
        data.password = await bcryptjs_1.default.hash(data.password, 10);
    return postgres_1.default.employee.update({ where: { id }, data });
};
exports.updateEmployee = updateEmployee;
const deleteEmployee = async (id) => postgres_1.default.employee.delete({ where: { id } });
exports.deleteEmployee = deleteEmployee;
