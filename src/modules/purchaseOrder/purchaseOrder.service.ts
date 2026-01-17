// src/services/purchaseOrder.service.ts
import prisma from "../../config/postgres";
import redis from "../../config/redis";
import crypto from "crypto";

const CACHE_TTL = 60; // seconds

const getCacheKey = (prefix: string, payload: any) => {
  const hash = crypto
    .createHash("md5")
    .update(JSON.stringify(payload))
    .digest("hex");
  return `${prefix}:${hash}`;
};

/* ---------------- CREATE ---------------- */
export const createPurchaseOrder = async (data: any) => {
  try {
    const existing = await prisma.purchaseOrder.findUnique({
      where: { poNo: data.poNo },
    });

    if (existing) {
      throw new Error("Purchase Order already exists");
    }

    const po = await prisma.purchaseOrder.create({
      data: {
        ...data,
        poDate: data.poDate ? new Date(data.poDate) : undefined,
        batchQty:
          data.batchQty !== null && data.batchQty !== undefined && data.batchQty !== ""
            ? Number(data.batchQty)
            : null,
        showStatus: String(data.showStatus), // ✅ FIX
      },
      include: { customer: true },
    });

    await redis.del("purchase_orders:list:*");

    return po;
  } catch (error) {
    console.error("Error creating PO:", error);
    throw error;
  }
};

export const createPurchaseOrderWithCreditCheck = async (data: any) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    if (customer.isBlacklisted) {
      throw new Error("Customer is blacklisted and cannot create purchase orders");
    }

    if (customer.creditApprovalStatus !== "Approved") {
      throw new Error("Customer credit is not approved by MD");
    }

    const totalCreditUsed = await getSlabLimit(customer.gstrNo);
    const newCreditUsage = totalCreditUsed + data.amount;

    if (newCreditUsage > customer.creditLimit) {
      throw new Error("Purchase order amount exceeds approved credit limit");
    }

    const po = await prisma.purchaseOrder.create({
      data: {
        ...data,
        mdApproval: "Approved",
        accountsApproval: "Approved",
      },
    });

    await redis.del("purchase_orders:list:*");

    return po;
  } catch (error) {
    console.error("Error creating PO with credit check:", error);
    throw error;
  }
};



/* ---------------- GET BY ID ---------------- */
export const getPurchaseOrderById = async (id: string) => {
  try {
    const cacheKey = `purchase_orders:single:${id}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (po) {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(po));
    }

    return po;
  } catch (error) {
    console.error("Error getting PO by ID:", error);
    throw error;
  }
};

/* ---------------- UPDATE ---------------- */
export const updatePurchaseOrder = async (id: string, data: any) => {
  try {
    const po = await prisma.purchaseOrder.update({
      where: { id },
      data,
    });

    await Promise.all([
      redis.del(`purchase_orders:single:${id}`),
      redis.del("purchase_orders:list:*"),
    ]);

    return po;
  } catch (error) {
    console.error("Error updating PO:", error);
    throw error;
  }
};

/* ---------------- DELETE ---------------- */
export const deletePurchaseOrder = async (id: string) => {
  try {
    await prisma.purchaseOrder.delete({ where: { id } });

    await Promise.all([
      redis.del(`purchase_orders:single:${id}`),
      redis.del("purchase_orders:list:*"),
    ]);
  } catch (error) {
    console.error("Error deleting PO:", error);
    throw error;
  }
};

/* ---------------- ADVANCED LIST (FAST) ---------------- */
export const getAllPurchaseOrders = async (
  filters: any,
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  order: "asc" | "desc" = "desc"
) => {
  try {
    const cacheKey = getCacheKey("purchase_orders:list", {
      filters,
      page,
      limit,
      sortBy,
      order,
    });

    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = {};

    if (filters.gstNo) where.gstNo = filters.gstNo;
    if (filters.poNo)
      where.poNo = { contains: filters.poNo, mode: "insensitive" };
    if (filters.overallStatus)
      where.overallStatus = filters.overallStatus;

    if (filters.fromDate || filters.toDate) {
      where.poDate = {};
      if (filters.fromDate) where.poDate.gte = filters.fromDate;
      if (filters.toDate) where.poDate.lte = filters.toDate;
    }

    const [data, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: { customer: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: order },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    const response = {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));

    return response;
  } catch (error) {
    console.error("Error getting all POs:", error);
    throw error;
  }
};

export const getPOByPoNo = async (poNo: string) => {
  try {
    const cacheKey = `po:poNo:${poNo}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const po = await prisma.purchaseOrder.findUnique({
      where: { poNo },
      select: {
        mdApproval: true,
        accountsApproval: true,
        designerApproval: true,
        ppicApproval: true,
        showStatus: true,
        gstNo: true,
        poNo: true,
        poDate: true,
        brandName: true,
        partyName: true,
      },
    });

    if (po) await redis.setex(cacheKey, 120, JSON.stringify(po));
    return po;
  } catch (error) {
    console.error("Error getting PO by PoNo:", error);
    throw error;
  }
};

export const getLatestPoCount = async (): Promise<number> => {
  try {
    const latest = await prisma.purchaseOrder.findFirst({
      orderBy: { createdAt: "desc" },
      select: { poNo: true },
    });

    if (!latest?.poNo) {
      console.warn("No PO found in database");
      return 0; // return 0 instead of throwing
    }

    const match = latest.poNo.match(/(\d+)$/);
    if (!match) {
      console.warn("Invalid PO format for latest PO:", latest.poNo);
      return 0; // fallback
    }

    return Number(match[1]);
  } catch (error) {
    console.error("Error getting latest PO count:", error);
    return 0; // fallback to 0 on unexpected errors
  }
};

export const getPOByGST = async (gstNo: string) => {
  try {
    const cacheKey = `po:gst:${gstNo}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const data = await prisma.purchaseOrder.findMany({ where: { gstNo } });

    await redis.setex(cacheKey, 120, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error("Error getting PO by GST:", error);
    throw error;
  }
};

export const getMDApprovedPOs = async () => {
  try {
    const cacheKey = `po:md_approved`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const data = await prisma.purchaseOrder.findMany({
      where: { mdApproval: "Approved" },
    });

    await redis.setex(cacheKey, 120, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error("Error getting MD approved POs:", error);
    throw error;
  }
};

export const getPPICApprovedBatches = async () => {
  try {
    const cacheKey = `po:ppic_approved_batches`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const data = await prisma.purchaseOrder.findMany({
      where: { ppicApproval: "Approved" },
      select: { batchNo: true },
    });

    const batches = data.map(d => d.batchNo).filter(Boolean);
    await redis.setex(cacheKey, 120, JSON.stringify(batches));
    return batches;
  } catch (error) {
    console.error("Error getting PPIC approved batches:", error);
    throw error;
  }
};

export const completePO = async (poNo: string) => {
  try {
    const po = await prisma.purchaseOrder.update({
      where: { poNo },
      data: { overallStatus: "Completed" },
    });

    await redis.del(`po:poNo:${poNo}`);
    await redis.del("purchase_orders:list:*"); // Invalidate lists
    return po;
  } catch (error) {
    console.error("Error completing PO:", error);
    throw error;
  }
};

export const getSlabLimit = async (gstNo: string) => {
  try {
    const cacheKey = `po:slab:${gstNo}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await prisma.purchaseOrder.aggregate({
      where: { gstNo },
      _sum: { amount: true },
    });

    const total = result._sum.amount || 0;
    await redis.setex(cacheKey, 120, JSON.stringify(total));
    return total;
  } catch (error) {
    console.error("Error getting slab limit:", error);
    throw error;
  }
};

export const getBatchNumbers = async () => {
  try {
    const cacheKey = `po:batch_numbers`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const data = await prisma.purchaseOrder.findMany({
      where: { batchNo: { not: null } },
      select: {
        batchNo: true,
        brandName: true,
      },
    });

    await redis.setex(cacheKey, 120, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error("Error getting batch numbers:", error);
    throw error;
  }
};



export const getPOAnalytics = async (fromDate?: Date, toDate?: Date) => {
  try {
    // Generate cache key
    const cacheKey = getCacheKey("po:analytics", { fromDate, toDate });
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Build where clause
    const where: any = {};
    if (fromDate || toDate) {
      where.poDate = {};
      if (fromDate) where.poDate.gte = fromDate;
      if (toDate) where.poDate.lte = toDate;
    }

    // Fetch analytics in parallel
    const [
      totalPOs,
      statusCounts,
      totalAmount,
      avgAmount,
      posPerCustomer,
      monthlyPOs,
      topCustomersByAmount,
      approvalStats,
    ] = await Promise.all([
      // Total POs
      prisma.purchaseOrder.count({ where }),

      // POs grouped by status
      prisma.purchaseOrder.groupBy({
        by: ["overallStatus"],
        _count: { id: true },
        where,
      }),

      // Total amount
      prisma.purchaseOrder.aggregate({
        _sum: { amount: true },
        where,
      }),

      // Average amount
      prisma.purchaseOrder.aggregate({
        _avg: { amount: true },
        where,
      }),

      // Top 10 customers by PO count
      prisma.purchaseOrder.groupBy({
        by: ["gstNo"],
        _count: { id: true },
        where,
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),

      // Monthly POs (last 12 months)
      prisma.$queryRaw<Array<{ month: Date; count: bigint }>>`
        SELECT 
          DATE_TRUNC('month', "poDate") as month,
          COUNT(*) as count
        FROM "PurchaseOrder"
        WHERE (${fromDate ? `"poDate" >= ${fromDate}` : 'TRUE'})
          AND (${toDate ? `"poDate" <= ${toDate}` : 'TRUE'})
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
      `,

      // Top 10 customers by total amount
      prisma.purchaseOrder.groupBy({
        by: ["gstNo"],
        _sum: { amount: true },
        where,
        orderBy: { _sum: { amount: "desc" } },
        take: 10,
      }),

      // Approval stats
      prisma.purchaseOrder.aggregate({
        _count: {
          mdApproval: true,
          accountsApproval: true,
          designerApproval: true,
          ppicApproval: true,
        },
        where: {
          ...where,
          OR: [
            { mdApproval: "Approved" },
            { accountsApproval: "Approved" },
            { designerApproval: "Approved" },
            { ppicApproval: "Approved" },
          ],
        },
      }),
    ]);

    // Prepare response
    const response = {
      totalPOs,
      statusCounts: statusCounts.map((s) => ({
        status: s.overallStatus,
        count: s._count.id,
      })),
      totalAmount: totalAmount._sum.amount || 0,
      averageAmount: avgAmount._avg.amount || 0,
      posPerCustomer: posPerCustomer.map((c) => ({
        gstNo: c.gstNo,
        count: c._count.id,
      })),
      monthlyPOs: monthlyPOs.map((m) => ({
        month: m.month.toISOString(),
        count: Number(m.count),
      })),
      topCustomersByAmount: topCustomersByAmount.map((c) => ({
        gstNo: c.gstNo,
        totalAmount: c._sum.amount || 0,
      })),
      approvalStats: {
        mdApproved: approvalStats._count.mdApproval || 0,
        accountsApproved: approvalStats._count.accountsApproval || 0,
        designerApproved: approvalStats._count.designerApproval || 0,
        ppicApproved: approvalStats._count.ppicApproval || 0,
      },
    };

    // Cache result for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(response));

    return response;
  } catch (error) {
    console.error("Error getting PO analytics:", error);
    throw error;
  }
};

export const bulkCreatePurchaseOrders = async (purchaseOrders: any[]) => {
  return prisma.purchaseOrder.createMany({
    data: purchaseOrders,
    skipDuplicates: true,
  });
};

