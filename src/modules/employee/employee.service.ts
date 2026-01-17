
import bcrypt from "bcryptjs";
import prisma from "../../config/postgres";

export const createEmployee = async (data: any) => {
  data.password = await bcrypt.hash(data.password, 10);
  return prisma.employee.create({ data });
};

export const getEmployees = async () =>
  prisma.employee.findMany({
    select: { password: false, refreshToken: false },
  });

export const updateEmployee = async (id: string, data: any) => {
  if (data.password)
    data.password = await bcrypt.hash(data.password, 10);

  return prisma.employee.update({ where: { id }, data });
};

export const deleteEmployee = async (id: string) =>
  prisma.employee.delete({ where: { id } });
