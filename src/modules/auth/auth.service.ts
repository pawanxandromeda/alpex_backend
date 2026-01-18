import bcrypt from "bcryptjs";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/jwt";
import prisma from "../../config/postgres";

export const login = async (username: string, password: string) => {
  const employee = await prisma.employee.findUnique({ where: { username } });
  if (!employee) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, employee.password);
  if (!match) throw new Error("Invalid credentials");

  const accessToken = generateAccessToken({
    id: employee.id,
    role: employee.authorization,
    department:employee.department,
  });

  const refreshToken = generateRefreshToken({ id: employee.id });

  await prisma.employee.update({
    where: { id: employee.id },
    data: { refreshToken },
  });

  return { accessToken, refreshToken };
};

export const refresh = async (token: string) => {
  const payload: any = verifyRefreshToken(token);

  const employee = await prisma.employee.findUnique({
    where: { id: payload.id },
  });

  if (!employee || employee.refreshToken !== token)
    throw new Error("Invalid refresh token");

  return generateAccessToken({
    id: employee.id,
    role: employee.authorization,
  });
};

export const logout = async (id: string) => {
  await prisma.employee.update({
    where: { id },
    data: { refreshToken: null },
  });
};
