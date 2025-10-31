import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { MongoClient } from "mongodb";

dotenv.config();

const router = express.Router();
const JWT_SECRET = 'h@G7#29s*&ZfJx3M!1qN$X2L@jP9kQ%y5T';

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}


// Middleware to authenticate and extract publicKey from JWT
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Expecting "Bearer <token>"
  console.log('Received token:', token);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized access, token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded Token:', decoded); // Debugging log
    req.publicKey = decoded.publicKey; // Attach the publicKey to the request object
    next();
  } catch (error) {
    console.error('Invalid token:', error); // Debugging log
    res.status(403).json({ message: "Invalid token" });
  }
};


// Route to fetch user-specific transactions (local Mongo only)
router.get("/userTransactions", authenticate, async (req, res) => {
  // Prefer req.user.publicKey from JWT; fall back to req.publicKey if your middleware set that
  const publicKey = req.user?.publicKey || req.publicKey;
  if (!publicKey) {
    return res.status(401).json({ message: "Unauthorized: missing publicKey in token." });
  }

  try {
    console.log(`Fetching local transactions for publicKey: ${publicKey}`);

    const db = req.app.locals.db;
    const collection = db.collection("transactions");

    // Only this user's non-deleted transactions, newest first
    const mongoTransactions = await collection
      .find({
        publicKey,
        $or: [{ isDeleted: { $exists: false } }, { isDeleted: { $ne: true } }],
      })
      .sort({ timestamp: -1 })
      .toArray();

    return res.status(200).json(mongoTransactions);
  } catch (error) {
    console.error("Error fetching user-specific transactions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
