import prisma from "../../config/postgres";



export const createCustomer = async (data: any) => {
  const existing = await prisma.customer.findUnique({
    where: { gstrNo: data.gstrNo },
  });

  if (existing) {
    throw new Error("Customer with this GST already exists");
  }

  return prisma.customer.create({ data });
};

export const loginCustomer = async (gstrNo: string, customerID: string) => {
  const customer = await prisma.customer.findFirst({
    where: { gstrNo, customerID },
  });

  if (!customer) throw new Error("Customer not found");

  return customer;
};

export const getAllCustomers = async () => {
  return prisma.customer.findMany({
    select: {
      id: true,
      customerID: true,
      customerName: true,
      address: true,
      creditLimit: true,
      paymentTerms: true,
      throughVia: true,
      gstrNo: true,
      kycProfile: true,
      contactName: true,
      contactPhone: true,
      contactEmail: true,
      remarks: true,
      relationshipStatus: true,
      gstCopy: true,
      dlExpiry: true,
      createdAt: true,
      updatedAt: true
    }
  });
};


export const getCustomerGSTList = async () => {
  return prisma.customer.findMany({
    select: {
      gstrNo: true,
      kycProfile: true,
      customerName: true,
    },
  });
};

export const updateCustomer = async (id: string, data: any) => {
  return prisma.customer.update({
    where: { id },
    data,
  });
};

export const deleteCustomer = async (id: string) => {
  return prisma.customer.delete({
    where: { id },
  });
};

export const bulkCreateCustomers = async (customers: any[]) => {
  return prisma.customer.createMany({
    data: customers,
    skipDuplicates: true, // GST unique handled
  });
};

export const requestCreditApproval = async (
  customerId: string,
  creditLimit: number
) => {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) throw new Error("Customer not found");

  if (customer.isBlacklisted) {
    throw new Error("Customer is blacklisted and cannot request credit");
  }

  return prisma.customer.update({
    where: { id: customerId },
    data: {
      creditLimit,
      creditApprovalStatus: "Pending",
    },
  });
};


export const blacklistCustomer = async (
  customerId: string,
  blacklistReason: string
) => {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) throw new Error("Customer not found");

  return prisma.customer.update({
    where: { id: customerId },
    data: {
      isBlacklisted: true,
      blacklistReason: blacklistReason,
      blacklistedAt: new Date(),
    },
  });
};


