import express from "express";
import bodyParser from "body-parser";
import session from 'express-session';
import cors from "cors";
import dotenv from "dotenv";
import { connectMongo, getMongoConnection } from './config/mongodb.js';
import transactionRoutes from "./routes/transactionRoutes.js";
import transactionRoutesReport from "./routes/transactionRoutesReport.js";
import transactionRead from "./routes/transactionRoutesRead.js";
import transactionRoutesUpdate from "./routes/transactionRoutesUpdate.js";
import transactionRoutesDelete from "./routes/transactionRoutesDelete.js";
import sync from './utils/sync.js';



dotenv.config();

const app = express();
await connectMongo();

const db_connect = getMongoConnection();
db_connect.on("error", console.error.bind(console, "MongoDB connection error:"));
db_connect.once("open", () => {
  console.log("MongoDB connected");
  app.locals.db = db_connect; // Assign db to app.locals for global access
});

app.use(cors());

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_only_do_not_use_in_prod",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

if (process.env.RESILIENTDB_ENABLE_SYNC === "true") {
  (async () => {
    try {
      await sync.initialize();
      console.log('Synchronization initialized.');
    } catch (error) {
      console.error('Error during sync initialization:', error);
    }
  })();
}

// Direct Test Routes without any prefix
app.get("/test", (req, res) => {
  console.log("GET /test route hit");
  res.send("Test route working");
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post("/test", (req, res) => {
  console.log("POST /test route hit");
  res.json({ message: "Test route working" });
});



const port = process.env.PORT || 8099;
app.listen(port, '0.0.0.0', () => {
  console.log(`Backend listening on port ${port}`);
});

app.use("/api/transactions", transactionRoutes);
app.use("/api/reports", transactionRoutesReport);
app.use("/api/read", transactionRead);
app.use("/api/updateTransactions", transactionRoutesUpdate);
app.use("/api/deleteTransactions", transactionRoutesDelete);