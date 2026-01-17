import { Request, Response } from "express";
import * as service from "./todo.service";

export const createTodoController = async (req: Request, res: Response) => {
  const { title, username } = req.body;
  const todo = await service.createTodo(title, username);
  res.status(201).json({ success: true, data: todo, message: "Todo created successfully" });
};

export const getTodosController = async (req: Request, res: Response) => {
  const { username } = req.query as { username: string };
  const todos = await service.getTodosByUsername(username);
  res.json({ success: true, data: todos, count: todos.length, message: "Todos fetched successfully" });
};

export const completeTodoController = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  try {
    const todo = await service.completeTodo(id);
    res.json({ success: true, data: todo, message: "Todo marked as completed" });
  } catch (err) {
    res.status(404).json({ success: false, message: "Todo not found" });
  }
};

export const deleteTodoController = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  try {
    await service.deleteTodo(id);
    res.json({ success: true, data: { id }, message: "Todo deleted successfully" });
  } catch (err) {
    res.status(404).json({ success: false, message: "Todo not found" });
  }
};
