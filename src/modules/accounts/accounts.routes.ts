import express from "express";
import * as controller from "./accounts.controller";
import { protect } from "../../common/middleware/auth.middleware";
import encryptResponse from "../../common/middleware/encryptResponse";

const router = express.Router();

// list bills (flattened across POs)
router.get("/", protect as any,encryptResponse, controller.getBills);

// list bills for a specific PO
router.get("/po/:poId/bills", protect as any,encryptResponse, controller.getBillsByPo);

// create new bill for a PO
router.post("/", protect as any, controller.createBill);

// raise a dispute on a bill
router.post("/:billId/dispute", protect as any, controller.raiseDispute);

// raise a PO-level dispute (only allowed for rejected POs)
router.post("/po/:poId/dispute", protect as any, controller.raisePoDispute);

// add or update sales comment on PO
router.post("/po/:poId/sales-comment", protect as any, controller.addSalesComment);

export default router;
