import express from "express";
import Transaction from "../models/Transaction.js";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import authenticate from "../middleware/authenticate.js";

dotenv.config();

const router = express.Router();
//const JWT_SECRET = 'h@G7#29s*&ZfJx3M!1qN$X2L@jP9kQ%y5T';

// Add login route
router.post("/login", async (req, res) => {
  try {
    const { publicKey } = req.body;
    if (!publicKey) {
      return res.status(400).json({ success: false, message: "publicKey is required" });
    }

    const token = jwt.sign({ publicKey }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.status(200).json({ success: true, token });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

router.get("/checkSession", (req, res) => {
  if (req.session.publicKey) {
    res.json({ loggedIn: true, publicKey: req.session.publicKey });
  } else {
    res.json({ loggedIn: false });
  }
});

// Route to add a new transaction
router.post("/saveTransaction", authenticate, async (req, res) => {
  try {
    
    const publicKey = req.user?.publicKey;
    if (!publicKey) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: missing publicKey in token." });
    }

    const {
      transactionID,
      amount,
      category,
      transactionType,
      notes,
      merchant,
      paymentMethod,
      timestamp,
    } = req.body;

 
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid 'amount'." });
    }
    if (!transactionType) {
      return res
        .status(400)
        .json({ success: false, message: "Missing 'transactionType'." });
    }

    const doc = {
      transactionID: transactionID || uuidv4(),        // 若未传则生成
      amount: Number(amount),
      category: category || null,
      transactionType,                                 // e.g. "income" | "expense" | ...
      notes: notes || null,
      merchant: merchant || null,
      paymentMethod: paymentMethod || null,
      timestamp: timestamp ? new Date(timestamp) : new Date(), // 默认当前时间
      publicKey,                                       // 只信任 JWT 中的
      isDeleted: false,                                // 软删标记（若你的 schema 使用）
    };

    const tx = new Transaction(doc);
    const result = await tx.save();

    return res.status(200).json({
      success: true,
      message: "Transaction saved successfully!",
      result,
    });
  } catch (error) {
    console.error("saveTransaction error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Route to get all transactions
router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find();
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

import mongoose from "mongoose";

router.delete("/deleteTransaction/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid transaction ID format." });
    }

    const deletedTransaction = await Transaction.findByIdAndDelete(id);
    if (!deletedTransaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found." });
    }

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully!",
      deletedTransaction,
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/restoreTransaction/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid transaction ID format." });
    }

    // Restore the transaction by setting is_deleted to false
    const restoredTransaction = await Transaction.findByIdAndUpdate(
      id,
      { is_deleted: false },
      { new: true } // Return the updated document
    );

    if (!restoredTransaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found." });
    }

    res.status(200).json({
      success: true,
      message: "Transaction restored successfully!",
      restoredTransaction,
    });
  } catch (error) {
    console.error("Error restoring transaction:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export the router
export default router;
