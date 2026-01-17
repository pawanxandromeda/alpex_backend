import { Request, Response } from "express";
import * as service from "./customer.service";
import { createCustomerSchema, updateCustomerSchema } from "./customer.validation";
import jwt from "jsonwebtoken";
import XLSX from "xlsx";

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const payload = createCustomerSchema.parse(req.body);
    const customer = await service.createCustomer(payload);
    res.status(201).json(customer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const loginCustomer = async (req: Request, res: Response) => {
  try {
    const { gstrNo, customerID } = req.body;

    const customer = await service.loginCustomer(gstrNo, customerID);

    const token = jwt.sign(
      { customerId: customer.id },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
};

export const verifyToken = (req: Request, res: Response) => {
  try {
    const decoded = jwt.verify(req.body.token, process.env.JWT_SECRET!);
    res.json({ valid: true, decoded });
  } catch {
    res.status(401).json({ valid: false });
  }
};

export const getCustomers = async (_: Request, res: Response) => {
  const customers = await service.getAllCustomers();
  (res as any).encryptAndSend(customers);
};

export const getGSTCustomers = async (_: Request, res: Response) => {
  res.json(await service.getCustomerGSTList());
};

export const updateCustomer = async (req: Request, res: Response) => {
  const payload = updateCustomerSchema.parse(req.body);
  const customer = await service.updateCustomer(req.params.id as string, payload);
  res.json(customer);
};

export const deleteCustomer = async (req: Request, res: Response) => {
  await service.deleteCustomer(req.params.id as string);
  res.json({ message: "Customer deleted successfully" });
};

export const importCustomers = async (req: Request, res: Response) => {
  try {
    /* ----------------------------------
       PARSE & VALIDATE MAPPINGS
    ---------------------------------- */
    let mappings: any = req.body.mappings;

    if (!mappings) {
      return res.status(400).json({ error: "Column mappings are required" });
    }

    if (typeof mappings === "string") {
      try {
        mappings = JSON.parse(mappings);
      } catch (err) {
        return res.status(400).json({ error: "Invalid mappings JSON" });
      }
    }

    if (typeof mappings !== "object" || Array.isArray(mappings)) {
      return res.status(400).json({ error: "Column mappings are required" });
    }

    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Excel file is required" });
    }

    /* ----------------------------------
       READ EXCEL FILE
    ---------------------------------- */
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json<any>(sheet, {
      defval: null,
    });

    if (!rows.length) {
      return res.status(400).json({ error: "Excel file is empty" });
    }

    /* ----------------------------------
       MAP + NORMALIZE DATA
    ---------------------------------- */
    const customers = rows
      .map((row) => {
        const record: any = {};

        Object.entries(mappings).forEach(([dbField, excelHeader]) => {
          let value = row[excelHeader as string];

          if (value !== null && value !== undefined) {
            if (
              [
                "customerID",
                "customerName",
                "gstrNo",
                "contactName",
                "contactPhone",
                "contactEmail",
                "address",
                "paymentTerms",
                "relationshipStatus",
                "kycProfile",
                "remarks",
                "gstCopy",
                "throughVia",
              ].includes(dbField)
            ) {
              value = String(value).trim();
            }

            if (dbField === "creditLimit") {
              value = Number(value) || 0;
            }

            if (dbField === "dlExpiry") {
              value =
                typeof value === "number"
                  ? new Date(Math.round((value - 25569) * 86400 * 1000))
                  : new Date(value);
            }
          } else {
            value = null;
          }

          record[dbField] = value;
        });

        if (!record.customerID || !record.customerName || !record.gstrNo) {
          return null;
        }

        return record;
      })
      .filter(Boolean);

    if (!customers.length) {
      return res.status(400).json({
        error: "No valid customer records found",
      });
    }

    /* ----------------------------------
       BULK INSERT
    ---------------------------------- */
    const result = await service.bulkCreateCustomers(customers);

    return res.json({
      success: true,
      totalRows: rows.length,
      inserted: result.count,
      skipped: rows.length - result.count,
    });
  } catch (error: any) {
    console.error("Customer Import Error:", error);

    return res.status(500).json({
      error: "Failed to import customers",
      message: error.message,
    });
  }
};

export const exportCustomers = async (_: Request, res: Response) => {
  const customers = await service.getAllCustomers();

  const worksheet = XLSX.utils.json_to_sheet(customers);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=customers.xlsx"
  );
  res.send(buffer);
};

export const requestCreditApproval = async (req: Request, res: Response) => {
  try {
    const { customerId, creditLimit } = req.body;

    if (!customerId || !creditLimit) {
      return res.status(400).json({ error: "Customer ID and credit limit are required" });
    }

    const updatedCustomer = await service.requestCreditApproval(customerId, creditLimit);

    res.status(200).json({
      message: "Credit approval request submitted successfully",
      customer: updatedCustomer,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const blacklistCustomer = async (req: Request, res: Response) => {
  try {
    const { customerId, blacklistReason } = req.body;

    if (!customerId || !blacklistReason) {
      return res.status(400).json({ error: "Customer ID and blacklist reason are required" });
    }

    const updatedCustomer = await service.blacklistCustomer(customerId, blacklistReason);

    res.status(200).json({
      message: "Customer has been blacklisted successfully",
      customer: updatedCustomer,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
