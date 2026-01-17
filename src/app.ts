import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";

import employeeRoutes from "./modules/employee/employee.routes";
import authRoutes from "./modules/auth/auth.routes";
import customerRoutes from "./modules/customer/customer.routes";
import todosRoutes from "./modules/todo/todo.routes";
import purchaseOrderRoutes from "./modules/purchaseOrder/purchaseOrder.routes";
import designerRoutes from "./modules/designer/designer.routes";
import accountsRoutes from "./modules/accounts/accounts.routes";

const app = express();

/* ✅ Helmet FIRST */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

/* ✅ JSON */
app.use(express.json());

/* ✅ CORS */
const allowedOrigins = [
  "https://alpex-f5hk.vercel.app",
];

app.use(
  cors({
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
  })
);



/* Routes */
app.use("/api/employees", employeeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/todos", todosRoutes);
app.use("/api/po", purchaseOrderRoutes);
app.use("/api/designer", designerRoutes);
app.use("/api/accounts", accountsRoutes);

export default app;
