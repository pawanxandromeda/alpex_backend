// designer.service.ts
import prisma from "../../config/postgres";
import { uploadBufferToS3 } from "../../common/utils/s3";
import { randomUUID } from "crypto";

export const getDesignerList = async (page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;

  const whereCondition = {
    mdApproval: "Approved",
    accountsApproval: "Approved",
  };

  const [data, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      skip,
      take: limit,
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        poNo: true,
        poDate: true,
        brandName: true,
        partyName: true,
        orderThrough: true,
        composition: true,
        section: true,
        tabletCapsuleDrySyrupBottle: true,
        roundOvalTablet: true,
        tabletColour: true,
        aluAluBlisterStripBottle: true,
        packStyle: true,
        productNewOld: true,
        batchQty: true,
        pvcColourBase: true,
        foilSize: true,
        design: true,
        designerApproval: true,
        createdAt: true,
      },
    }),

    prisma.purchaseOrder.count({
      where: whereCondition,
    }),
  ]);

  return { data, total, page, limit };
};

export const updateDesignSpecs = async (
  poId: string,
  data: any,
  employeeId: string
) => {
  // 1️⃣ Validate designer
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!emp || emp.department.toLowerCase() !== "design") {
    throw new Error("Only designer can update specs");
  }

  // 2️⃣ Fetch existing PO & actions
  const poRecord: any = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    select: { designerActions: true },
  });

  if (!poRecord) {
    throw new Error("Purchase Order not found");
  }

  const existingActions = Array.isArray(poRecord.designerActions)
    ? poRecord.designerActions
    : [];

  // 3️⃣ Create action with remarks
  const newAction = {
    id: randomUUID(),
    employeeId,
    employeeName: emp.name,
    action: "Specs Updated",
    remarks: data.remarks ?? null, // ✅ DESIGNER REMARKS
    createdAt: new Date().toISOString(),
  };

  // 4️⃣ Remove remarks from main update payload
  const { remarks, ...specsData } = data;

  // 5️⃣ Update PO
  const updated = await prisma.purchaseOrder.update({
    where: { id: poId },
    data: {
      // 🔹 Allowed design spec fields
      tabletCapsuleDrySyrupBottle: specsData.tabletCapsuleDrySyrupBottle,
      roundOvalTablet: specsData.roundOvalTablet,
      tabletColour: specsData.tabletColour,
      aluAluBlisterStripBottle: specsData.aluAluBlisterStripBottle,
      packStyle: specsData.packStyle,
      productNewOld: specsData.productNewOld,
      batchQty: specsData.batchQty,
      pvcColourBase: specsData.pvcColourBase,
      foilSize: specsData.foilSize,

      // 🔹 Reset approval
      designerApproval: "Pending",

      // 🔹 Append action log
      designerActions: [...existingActions, newAction],
    },
  });

  return updated;
};

export const uploadDesign = async (
  poId: string,
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  employeeId: string
) => {
  const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!emp) throw new Error("Employee not found");

  if (emp.department.toLowerCase() !== "designer") {
    throw new Error("Only designer can upload design");
  }

  const key = `designs/${poId}/${Date.now()}-${originalName.replace(/\s+/g, "_")}`;
  const url = await uploadBufferToS3(buffer, key, mimeType);

  // append action to PO designerActions
  const poRecord: any = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
  const actions = Array.isArray(poRecord?.designerActions) ? poRecord.designerActions : [];

  const newAction = {
    id: randomUUID(),
    employeeId,
    action: "Design Uploaded",
    comments: null,
    createdAt: new Date().toISOString(),
  };

  const updatedPO = await prisma.purchaseOrder.update({
    where: { id: poId },
    data: ({
      design: url,
      designerApproval: "Pending",
      designerActions: [...actions, newAction],
    } as any),
  });

  return updatedPO;
};

export const actionOnDesign = async (
  poId: string,
  action: string,
  comments: string | undefined,
  employeeId: string
) => {
  const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!emp) throw new Error("Employee not found");
  if ((emp.department || "").toLowerCase() !== "design")
    throw new Error("Only designer department members can approve or reject designs");

  if (!["approve", "reject"].includes(action)) throw new Error("Invalid action");

  const dbAction = action === "approve" ? "Approved" : "Rejected";

  // append approval/rejection action
  const poRecord: any = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
  const actions = Array.isArray(poRecord?.designerActions) ? poRecord.designerActions : [];

  const newAction = {
    id: randomUUID(),
    employeeId,
    action: dbAction,
    comments: comments || null,
    createdAt: new Date().toISOString(),
  };

  const updated = await prisma.purchaseOrder.update({
    where: { id: poId },
    data: ({ designerApproval: dbAction, designerActions: [...actions, newAction] } as any),
  });

  return updated;
};