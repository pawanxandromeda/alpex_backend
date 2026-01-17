import { Request, Response } from "express";
import * as service from "./purchaseOrder.service";
import * as customerService from "../customer/customer.service";
import XLSX from "xlsx";
import prisma from "../../config/postgres";


/**
 * CREATE Purchase Order ❌ (no encryption)
 */
export const createPO = async (req: Request, res: Response) => {
  try {
    const po = await service.createPurchaseOrder(req.body);
    return res.status(201).json({ success: true, data: po });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * CREATE Purchase Order with Credit Limit Check
 */
export const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const poData = req.body;

    if (!poData.customerId || !poData.amount) {
      return res.status(400).json({ error: "Customer ID and amount are required" });
    }

    const po = await service.createPurchaseOrderWithCreditCheck(poData);

    res.status(201).json({
      message: "Purchase order created and auto-approved successfully",
      purchaseOrder: po,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * GET PO by ID ✅
 */
export const getPOById = async (req: Request, res: Response) => {
  try {
    const po = await service.getPurchaseOrderById(req.params.id as string);
    if (!po) {
      return (res as any).encryptAndSend({ message: "Purchase Order not found" });
    }
    (res as any).encryptAndSend(po);
  } catch (error: any) {
    (res as any).encryptAndSend({ message: error.message });
  }
};

/**
 * UPDATE PO ❌
 */
export const updatePO = async (req: Request, res: Response) => {
  try {
    const po = await service.updatePurchaseOrder(req.params.id as string, req.body);
    return res.status(200).json({ success: true, data: po });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update Purchase Order",
    });
  }
};

/**
 * DELETE PO ❌
 */
export const deletePO = async (req: Request, res: Response) => {
  try {
    await service.deletePurchaseOrder(req.params.id as string);
    return res.status(200).json({
      success: true,
      message: "Purchase Order deleted successfully",
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to delete Purchase Order",
    });
  }
};

/**
 * GET all POs ✅
 */
export const getAllPOs = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy,
      order,
      gstNo,
      poNo,
      overallStatus,
      fromDate,
      toDate,
    } = req.query;

    const result = await service.getAllPurchaseOrders(
      {
        gstNo: gstNo as string,
        poNo: poNo as string,
        overallStatus: overallStatus as string,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
      },
      Number(page),
      Number(limit),
      sortBy as string,
      order as "asc" | "desc"
    );

    (res as any).encryptAndSend(result);
  } catch (error: any) {
    (res as any).encryptAndSend({ message: error.message });
  }
};

/**
 * GET PO by PO Number ✅
 */
export const getPOByPoNo = async (req: Request, res: Response) => {
  try {
    const po = await service.getPOByPoNo(req.params.poNo as string);
    if (!po) {
      return (res as any).encryptAndSend({ message: "PO not found" });
    }
    (res as any).encryptAndSend(po);
  } catch (error: any) {
    (res as any).encryptAndSend({ message: error.message });
  }
};

/**
 * GET latest PO count ✅
 */
export const getPOCount = async (_: Request, res: Response) => {
  try {
    const count = await service.getLatestPoCount();
    (res as any).encryptAndSend({ count });
  } catch (error: any) {
    (res as any).encryptAndSend({ message: error.message });
  }
};

/**
 * GET Slab limit by GST ✅
 */
export const getSlabLimit = async (req: Request, res: Response) => {
  try {
    const totalAmount = await service.getSlabLimit(req.params.gstNo as string );
    (res as any).encryptAndSend({ totalAmount });
  } catch (error: any) {
    (res as any).encryptAndSend({ message: error.message });
  }
};

/**
 * GET POs by GST ✅
 */
export const getPOByGST = async (req: Request, res: Response) => {
  try {
    const pos = await service.getPOByGST(req.params.gstNo as string);
    (res as any).encryptAndSend(pos);
  } catch (error: any) {
    (res as any).encryptAndSend({ message: error.message });
  }
};

/**
 * GET list of customers with GST ✅
 */
export const getGstrList = async (_req: Request, res: Response) => {
  try {
    const list = await customerService.getCustomerGSTList();
    (res as any).encryptAndSend(list);
  } catch (error: any) {
    (res as any).encryptAndSend({ message: error.message });
  }
};

/**
 * GET MD-approved POs ✅
 */
export const getMDApproved = async (_req: Request, res: Response) => {
  try {
    const pos = await service.getMDApprovedPOs();
    (res as any).encryptAndSend(pos);
  } catch (error: any) {
    (res as any).encryptAndSend({ message: error.message });
  }
};

/**
 * GET PPIC-approved batches ✅
 */
export const getPPICApprovedBatches = async (_req: Request, res: Response) => {
  try {
    const batches = await service.getPPICApprovedBatches();
    (res as any).encryptAndSend(batches);
  } catch (error: any) {
    (res as any).encryptAndSend({ message: error.message });
  }
};

/**
 * COMPLETE PO ❌
 */
export const completePO = async (req: Request, res: Response) => {
  try {
    const po = await service.completePO(req.params.poNo as string);
    return res.status(200).json({ success: true, data: po });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to complete Purchase Order",
    });
  }
};

/**
 * GET batch numbers ✅
 */
export const getBatchNumbers = async (_req: Request, res: Response) => {
  try {
    const batches = await service.getBatchNumbers();
    (res as any).encryptAndSend(batches);
  } catch (error: any) {
    (res as any).encryptAndSend({ message: error.message });
  }
};

/**
 * GET PO analytics ✅
 */
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate } = req.query;
    const analytics = await service.getPOAnalytics(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined
    );
    (res as any).encryptAndSend(analytics);
  } catch (error: any) {
    (res as any).encryptAndSend({ message: error.message });
  }
};


const excelDateToJS = (value: any) => {
  if (!value) return null;
  if (typeof value === "number") {
    return new Date(Math.round((value - 25569) * 86400 * 1000));
  }
  return new Date(value);
};

export const importPurchaseOrders = async (req: Request, res: Response) => {
  try {
    let mappings: any = req.body.mappings;

    if (!mappings) {
      return res.status(400).json({ error: "Column mappings are required" });
    }

    if (typeof mappings === "string") {
      mappings = JSON.parse(mappings);
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Excel file is required" });
    }

    /* ---------- READ EXCEL ---------- */
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });

    if (!rows.length) {
      return res.status(400).json({ error: "Excel file is empty" });
    }

    /* ---------- MAP DATA ---------- */
    const purchaseOrders = rows
      .map((row) => {
        const record: any = {};

        Object.entries(mappings).forEach(([dbField, excelHeader]) => {
          let value = row[excelHeader as string];

          if (value === null || value === undefined || value === "") {
            record[dbField] = null;
            return;
          }

          /* ---- STRING ---- */
          if (
            [
              "gstNo","poNo","brandName","partyName","batchNo","paymentTerms",
              "invCha","cylChar","orderThrough","address","composition","notes",
              "rmStatus","section","tabletCapsuleDrySyrupBottle","roundOvalTablet",
              "tabletColour","aluAluBlisterStripBottle","packStyle","productNewOld",
              "qaObservations","pvcColourBase","foil","lotNo","foilSize",
              "foilPoVendor","cartonPoVendor","design","overallStatus",
              "invoiceNo","showStatus","mdApproval","accountsApproval",
              "designerApproval","ppicApproval","salesComments",
            ].includes(dbField)
          ) {
            value = String(value).trim();
          }

          /* ---- INTEGER ---- */
          if (
            [
              "poQty","batchQty","foilQuantity","cartonQuantity",
              "qtyPacked","noOfShippers","changePart","cyc",
            ].includes(dbField)
          ) {
            value = Math.max(0, Number(value) || 0);
          }

          /* ---- FLOAT ---- */
          if (["poRate","amount","mrp","advance"].includes(dbField)) {
            value = Math.max(0, Number(value) || 0);
          }

          /* ---- DATE ---- */
          if (
            [
              "poDate","dispatchDate","expiry","foilPoDate","foilBillDate",
              "cartonPoDate","cartonBillDate","packingDate","invoiceDate",
            ].includes(dbField)
          ) {
            value = excelDateToJS(value);
          }

          record[dbField] = value;
        });

        /* ---- REQUIRED ---- */
        if (!record.poNo || !record.gstNo) return null;

        return record;
      })
      .filter(Boolean);

    if (!purchaseOrders.length) {
      return res.status(400).json({ error: "No valid purchase orders found" });
    }

    /* ---------- 🔥 NORMALIZE + DEDUPE HERE ---------- */
    const uniqueMap = new Map<string, any>();

    for (const po of purchaseOrders) {
      const normalized = {
        ...po,
        poNo: po.poNo.toUpperCase().trim(),
        gstNo: po.gstNo.toUpperCase().trim(),

        paymentTerms: po.paymentTerms ?? "NA",
        orderThrough: po.orderThrough ?? "Direct",

        rmStatus: po.rmStatus ?? "Pending",
        overallStatus: po.overallStatus ?? "Open",

        mdApproval: po.mdApproval ?? "Pending",
        accountsApproval: po.accountsApproval ?? "Pending",
        designerApproval: po.designerApproval ?? "Pending",
        ppicApproval: po.ppicApproval ?? "Pending",

        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const key = `${normalized.poNo}_${normalized.gstNo}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, normalized);
      }
    }

    const normalizedOrders = Array.from(uniqueMap.values());

    /* ---------- INSERT ---------- */
    const result = await service.bulkCreatePurchaseOrders(normalizedOrders);

    return res.json({
      success: true,
      totalRows: rows.length,
      inserted: result.count,
      skipped: rows.length - result.count,
    });
  } catch (error: any) {
    console.error("PO Import Error:", error);
    return res.status(500).json({
      error: "Failed to import purchase orders",
      message: error.message,
    });
  }
};


export const exportPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const purchaseOrders = await prisma.purchaseOrder.findMany();

    const worksheet = XLSX.utils.json_to_sheet(purchaseOrders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PurchaseOrders");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=purchase_orders.xlsx"
    );
    res.setHeader("Content-Length", buffer.length);

    return res.status(200).end(buffer);
  } catch (error) {
    console.error("Export Purchase Orders Error:", error);
    return res.status(500).json({
      message: "Failed to export purchase orders",
    });
  }
};
