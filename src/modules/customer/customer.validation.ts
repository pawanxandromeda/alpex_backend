import { z } from "zod";

// Contact schema for multiple contacts
export const contactSchema = z.object({
  name: z.string().min(1, "Contact name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email().optional().or(z.literal('')),
  role: z.string().min(1, "Contact role is required")
});

export const createCustomerSchema = z.object({
  customerID: z.string().min(1, "Customer ID is required"),
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  creditLimit: z.coerce.number().positive("Credit limit must be positive").default(0),
  creditApprovalStatus: z.enum(['Approved', 'Pending', 'Rejected']).default('Approved'),
  paymentTerms: z.string().min(1, "Payment terms are required"),
  throughVia: z.string().min(1, "Through/Via is required"),
  gstrNo: z.string().length(15, "GSTIN must be 15 characters"),
  kycProfile: z.string().min(1, "KYC profile is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactPhone: z.string().length(10, "Phone must be 10 digits"),
  contactEmail: z.string().email().optional().or(z.literal('')),
  
  // Multiple contacts - optional
  contacts: z.array(contactSchema).optional().default([]),
  
  // Optional fields that can be null/empty
  remarks: z.string().optional().nullable().or(z.literal('')).default(''),
  relationshipStatus: z.enum(['Good', 'Moderate', 'Bad']).optional().nullable().default('Moderate'),
  gstCopy: z.string().optional().nullable().or(z.literal('')).default(''),
  dlExpiry: z.string().datetime().optional().nullable().or(z.literal('')),
  
  // Blacklist fields
  isBlacklisted: z.boolean().default(false),
  blacklistReason: z.string().optional().nullable().or(z.literal('')).default(''),
  blacklistedAt: z.string().datetime().optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// Schema for credit approval request
export const requestCreditSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  creditLimit: z.coerce.number().positive("Credit limit must be positive"),
});

// Schema for blacklist request
export const blacklistCustomerSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  blacklistReason: z.string().min(1, "Blacklist reason is required"),
});