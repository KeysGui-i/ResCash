// routes/transactionRoutesUpdate.js
import express from "express";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import authenticate from "../middleware/authenticate.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Update
// Update (local Mongo only, restricted by publicKey)
router.put("/updateTransaction/:id", authenticate, async (req, res) => {
  try {
    const publicKey = req.user?.publicKey;
    if (!publicKey) {
      return res.status(401).json({ success: false, message: "Unauthorized: missing publicKey in token." });
    }

    const { id } = req.params; // id = transactionID (custom UUID), not Mongo _id
    if (!id) {
      return res.status(400).json({ success: false, message: "Transaction ID is required." });
    }

    // Only allow these fields to be updated (whitelist)
    const {
      amount,
      category,
      currency,
      transactionType,
      notes,
      merchant,
      paymentMethod,
      timestamp,
    } = req.body;

    // Basic validation
    const update = {};
    if (amount !== undefined) {
      const amountNum = Number(amount);
      if (isNaN(amountNum) || amountNum < 0) {
        return res.status(400).json({ success: false, message: "Invalid amount provided." });
      }
      update.amount = amountNum;
    }
    if (category !== undefined) update.category = category;
    if (currency !== undefined) update.currency = currency;
    if (transactionType !== undefined) update.transactionType = transactionType;
    if (notes !== undefined) update.notes = notes;
    if (merchant !== undefined) update.merchant = merchant;
    if (paymentMethod !== undefined) update.paymentMethod = paymentMethod;
    if (timestamp !== undefined) update.timestamp = timestamp ? new Date(timestamp) : null;

    // Find and update by transactionID + publicKey + not soft deleted
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { transactionID: id, publicKey, isDeleted: { $ne: true } },
      { $set: update },
      { new: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found or not owned by this user.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction updated successfully.",
      updatedTransaction,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});


// export the router
export default router;
