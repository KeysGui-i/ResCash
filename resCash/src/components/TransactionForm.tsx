import React, { useState, useEffect } from "react";

import "../App.css";
import NotificationModal from "./NotificationModal";

interface TransactionFormProps {
  onLogout: () => void;
  token: string | null;
  initialData?: Transaction;
  onFormChange?: (updatedFields: Partial<Transaction>) => void;
  hideSubmitButton?: boolean;
  hideHeading?: boolean;
  onSdkOpen?: () => void;
  onSdkComplete?: () => void;
}

interface Transaction {
  transactionID: string;
  amount: number;
  category: string;
  transactionType: string;
  notes: string;
  merchant: string;
  paymentMethod: string;
  timestamp: string;
  is_deleted: boolean;
}

const expenseCategories = [
  "Housing",
  "Utilities",
  "Food",
  "Transportation",
  "Entertainment",
  "Healthcare",
];

const incomeCategories = [
  "Employment",
  "Business",
  "Investments",
  "Rentals",
  "Gifts/Donations",
  "Miscellaneous",
];

const TransactionForm: React.FC<TransactionFormProps> = ({
  onLogout,
  token,
  initialData,
  onFormChange,
  hideSubmitButton,
  hideHeading,
  onSdkOpen,
  onSdkComplete,
}) => {
  const [amount, setAmount] = useState<string>(
    initialData?.amount.toString() || ""
  );
  const [category, setCategory] = useState<string>(initialData?.category || "");
  const [transactionType, setTransactionType] = useState<string>(
    initialData?.transactionType || "Expense"
  );
  const [notes, setNotes] = useState<string>(initialData?.notes || "");
  const [merchant, setMerchant] = useState<string>(initialData?.merchant || "");
  const [paymentMethod, setPaymentMethod] = useState<string>(
    initialData?.paymentMethod || "Card"
  );
  const [timestamp, setTimestamp] = useState<string>(
    initialData?.timestamp || new Date().toISOString()
  );
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalMessage, setModalMessage] = useState<string>("");

  const handleTransactionTypeChange = (e: any) => {
    const type = e.target.value;
    setTransactionType(type);
    setCategory(""); // Reset category when transaction type changes
    onFormChange && onFormChange({ transactionType: type, category: "" });
  };

  const handleCategoryChange = (e: any) => {
    const selectedCategory = e.target.value;
    setCategory(selectedCategory);
    onFormChange && onFormChange({ category: selectedCategory });
  };

  useEffect(() => {
    if (onFormChange) {
      onFormChange({
        amount: parseFloat(amount),
        category,
        transactionType,
        notes,
        merchant,
        paymentMethod,
        timestamp,
      });
    }
  }, [
    amount,
    category,
    transactionType,
    notes,
    merchant,
    paymentMethod,
    timestamp,
    onFormChange,
  ]);



  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const currentTimestamp = new Date().toISOString();
  setTimestamp(currentTimestamp);

  const requestBody = {
    amount,
    category,
    transactionType,
    notes,
    merchant,
    paymentMethod,
    timestamp: currentTimestamp,
  };

  try {
    const resp = await fetch("http://localhost:8099/api/transactions/saveTransaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`, // 用 JWT 验证
      },
      body: JSON.stringify(requestBody),
    });
    const data = await resp.json();
    if (data.success) {
      setModalTitle("Success");
      setModalMessage("Transaction saved successfully!");
    } else {
      setModalTitle("Failed");
      setModalMessage(data.message || "Unknown error.");
    }
  } catch (err: any) {
    setModalTitle("Error");
    setModalMessage(err.message || "Network error");
  } finally {
    setShowModal(true);
  }
};


  const handleCloseModal = () => {
    setShowModal(false);
    localStorage.setItem("currentPage", "home");
    window.location.reload();
  };

  return (
    <>
      <div className="form-container">
        <div className="heading-container">
          <h2 className="heading">Create Transaction</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label htmlFor="amount">Amount</label>
            <input
              type="text"
              className="form-control"
              id="amount"
              placeholder="Enter your amount here"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                onFormChange &&
                  onFormChange({ amount: parseFloat(e.target.value) });
              }}
            />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="transactionType">Transaction Type</label>
            <select
              className="form-control"
              id="transactionType"
              value={transactionType}
              onChange={handleTransactionTypeChange}
            >
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
            </select>
          </div>

          <div className="form-group mb-3">
            <label htmlFor="category">Category</label>
            <select
              className="form-control"
              id="category"
              value={category}
              onChange={handleCategoryChange}
            >
              <option value="" disabled>
                Select category
              </option>
              {transactionType === "Expense" && (
                <optgroup label="Expense Categories">
                  {expenseCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </optgroup>
              )}
              {transactionType === "Income" && (
                <optgroup label="Income Categories">
                  {incomeCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="form-group mb-3">
            <label htmlFor="notes">Notes</label>
            <input
              type="text"
              className="form-control"
              id="notes"
              placeholder="Enter notes here (optional)"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                onFormChange && onFormChange({ notes: e.target.value });
              }}
            />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="merchant">Merchant</label>
            <input
              type="text"
              className="form-control"
              id="merchant"
              placeholder="Enter merchant name here (optional)"
              value={merchant}
              onChange={(e) => {
                setMerchant(e.target.value);
                onFormChange && onFormChange({ merchant: e.target.value });
              }}
            />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="paymentMethod">Payment Method</label>
            <select
              className="form-control"
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                onFormChange && onFormChange({ paymentMethod: e.target.value });
              }}
            >
              <option value="Card">Card</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          <div className="form-group text-center">
            <button type="submit" className="btn btn-primary button">
              Submit Transaction
            </button>
          </div>
        </form>
      </div>

      <NotificationModal
        show={showModal}
        title={modalTitle}
        message={modalMessage}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default TransactionForm;
