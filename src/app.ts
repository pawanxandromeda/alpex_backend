import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response, NextFunction } from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";

import employeeRoutes from "./modules/employee/employee.routes";
import authRoutes from "./modules/auth/auth.routes";
import customerRoutes from "./modules/customer/customer.routes";
import todosRoutes from "./modules/todo/todo.routes";
import purchaseOrderRoutes from "./modules/purchaseOrder/purchaseOrder.routes";
import designerRoutes from "./modules/designer/designer.routes";
import accountsRoutes from "./modules/accounts/accounts.routes";

const app: Application = express();

/* ===============================
   HELMET (FIRST)
================================ */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

/* ===============================
   JSON BODY
================================ */
app.use(express.json());

/* ===============================
   CORS CONFIG (TS SAFE)
================================ */
const allowedOrigins: string[] = [
  "https://alpex-f5hk.vercel.app",
];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
  ],
};

app.use(cors(corsOptions));

/* 🔥 REQUIRED FOR PREFLIGHT */
app.options(/.*/, cors(corsOptions));


/* ===============================
   ROUTES
================================ */
app.use("/api/employees", employeeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/todos", todosRoutes);
app.use("/api/po", purchaseOrderRoutes);
app.use("/api/designer", designerRoutes);
app.use("/api/accounts", accountsRoutes);

/* ===============================
   GLOBAL ERROR HANDLER
================================ */
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: err.message });
  }

  res.status(500).json({ message: "Internal Server Error" });
});

export default app;
