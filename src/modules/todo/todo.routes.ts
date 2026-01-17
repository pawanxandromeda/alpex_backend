import { Router } from "express";
import {
  createTodoController,
  getTodosController,
  completeTodoController,
  deleteTodoController,
} from "./todo.controller";
import { createTodoSchema, getTodosSchema, todoIdSchema } from "./todo.validation";
import { validate } from "../../common/middleware/zod.validate";


const router = Router();

router.post("/create", validate(createTodoSchema), createTodoController);
router.get("/", validate(getTodosSchema), getTodosController);
router.put("/:id", validate(todoIdSchema), completeTodoController);
router.delete("/:id", validate(todoIdSchema), deleteTodoController);

export default router;
