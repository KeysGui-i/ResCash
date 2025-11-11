import fetch from "cross-fetch"; // Ensure cross-fetch is installed for server-side requests
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const ENABLE_CROW = process.env.ENABLE_CROW === "true";
const CROW_SERVER_URI = process.env.CROW_SERVER_URI || null;

function normalizeBase(url) {
  if (!url) return url;
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

// Service function to get the public key
const getPublicKey = async (id) => {
if (!ENABLE_CROW) return null; 
  if (!CROW_SERVER_URI) {
    throw new Error("[crow] CROW_SERVER_URI not set but ENABLE_CROW=true");
  }

  const url = `${normalizeBase(CROW_SERVER_URI)}/${id}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rawText = await response.text(); // Log raw response text
    try {
      const data = JSON.parse(rawText);
      const ownersBeforeArray = data.inputs[0].owners_before; // Extract the owners_before array
      if (Array.isArray(ownersBeforeArray) && ownersBeforeArray.length > 0) {
        return ownersBeforeArray[0]; // Return the first element as the public key
      } else {
        throw new Error("owners_before is not a valid array or is empty");
      }
    } catch (parseError) {
      throw new Error("Could not parse JSON response");
    }
  } catch (error) {
    throw new Error("Could not fetch public key");
  }
};

async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      console.error(`[crow] attempt ${attempt} failed. HTTP ${res.status}`);
    } catch (err) {
      console.error(`[crow] attempt ${attempt} error:`, err);
    }
    await new Promise((r) => setTimeout(r, delay));
  }
  throw new Error("[crow] failed to fetch after multiple attempts");
}



const fetchTransactionsByPublicKey = async (publicKey) => {
  if (!ENABLE_CROW) return []; 
  if (!CROW_SERVER_URI) {
    throw new Error("[crow] CROW_SERVER_URI not set but ENABLE_CROW=true");
  }

  const url = normalizeBase(CROW_SERVER_URI);

  try {
    const response = await fetchWithRetry(url);

    const rawText = await response.text();
    console.log("Raw response text:", rawText);

    if (!rawText) {
      throw new Error("Empty response from server");
    }

    const transactions = JSON.parse(rawText);

    const userTransactions = transactions.filter((transaction) => {
      const isCreator = transaction.inputs.some((input) =>
        input.owners_before.includes(publicKey)
      );
      const isRecipient = transaction.outputs.some((output) =>
        output.public_keys.includes(publicKey)
      );

      return isCreator || isRecipient;
    });

    const transactionIDs = userTransactions.map((transaction) => transaction.id);
    console.log("Transaction IDs:", transactionIDs);

    return transactionIDs;
  } catch (error) {
    console.error("Error fetching transactions by public key:", error);
    throw error;
  }
};


export { getPublicKey, fetchTransactionsByPublicKey };

