// routes/transactionRoutes.js
import express from "express";
import Transaction from "../models/Transaction.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();


// Delete
import mongoose from "mongoose";

// Delete a transaction (local Mongo only, restricted by publicKey)
router.delete("/deleteTransaction/:id", authenticate, async (req, res) => {
  try {
    const publicKey = req.user?.publicKey;
    if (!publicKey) {
      return res.status(401).json({ success: false, message: "Unauthorized: missing publicKey in token." });
    }

    const { id } = req.params;

    // Try to delete by transactionID (custom ID used in your schema, not _id)
    const deletedTransaction = await Transaction.findOneAndUpdate(
      { transactionID: id, publicKey, isDeleted: { $ne: true } },
      { $set: { isDeleted: true, deletedAt: new Date() } },  // soft delete
      { new: true }
    );

    if (!deletedTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found or not owned by this user.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully!",
      deletedTransaction,
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});



// export the router
export default router;
