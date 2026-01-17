import { Request, Response } from "express";
import * as service from "./employee.service";

export const create = async (req: Request, res: Response) =>
  res.json(await service.createEmployee(req.body));

export const getAll = async (_: Request, res: Response) =>
  res.json(await service.getEmployees());

export const update = async (req: Request, res: Response) =>
  res.json(await service.updateEmployee(req.params.id as string, req.body));

export const remove = async (req: Request, res: Response) => {
  await service.deleteEmployee(req.params.id as string);
  res.json({ message: "Deleted" });
};
