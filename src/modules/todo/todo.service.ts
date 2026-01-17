import prisma from "../../config/postgres";

export const createTodo = async (title: string, username: string) => {
  return prisma.todo.create({
    data: { title, username },
  });
};

export const getTodosByUsername = async (username: string) => {
  return prisma.todo.findMany({
    where: { username },
    orderBy: { createdAt: "desc" },
  });
};

export const completeTodo = async (id: string) => {
  return prisma.todo.update({
    where: { id },
    data: { completed: true },
  });
};

export const deleteTodo = async (id: string) => {
  return prisma.todo.delete({
    where: { id },
  });
};
