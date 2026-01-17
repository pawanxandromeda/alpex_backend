import { z } from "zod";

// Create Todo
export const createTodoSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    username: z.string().min(1, "Username is required"),
  }),
});

// Get Todos by username
export const getTodosSchema = z.object({
  query: z.object({
    username: z.string().min(1, "Username is required"),
  }),
});

// Complete/Delete Todo by ID
export const todoIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid Todo ID"),
  }),
});
