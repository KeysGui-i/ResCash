// services/graphqlService.js
import pkg from "@apollo/client";
const { ApolloClient, InMemoryCache, gql } = pkg;
import fetch from "cross-fetch"; // Ensure cross-fetch is installed for server-side GraphQL requests
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const ENABLE_GRAPHQL = process.env.ENABLE_GRAPHQL === "true";
let client = null;

if (ENABLE_GRAPHQL) {
  const GRAPHQL_URI = process.env.GRAPHQL_URI;
  if (!GRAPHQL_URI) {
    throw new Error("[graphql] GRAPHQL_URI not set but ENABLE_GRAPHQL=true");
  }

  client = new ApolloClient({
    uri: GRAPHQL_URI,
    cache: new InMemoryCache(),
    fetch,
  });

  console.log("[graphql] Enabled:", GRAPHQL_URI);
} else {
  console.log("[graphql] Disabled (ENABLE_GRAPHQL != 'true')");
}


// Define the GraphQL query for fetching the public key
const GET_PUBLIC_KEY = gql`
  query GetPublicKey($id: ID!) {
    getTransaction(id: $id) {
      publicKey
    }
  }
`;

// Service function to get the public key
const getPublicKey = async (id) => {
  if (!ENABLE_GRAPHQL) return null;
  try {
    const response = await client.query({
      query: GET_PUBLIC_KEY,
      variables: { id }, // Pass the ID as a variable
    });
    return response.data.getTransaction.publicKey; // Return the public key
  } catch (error) {
    console.error("Error fetching public key:", error);
    throw new Error("Could not fetch public key");
  }
};

//+++++++++++++++++++++++++++++++++++++++++++++++++++++
// Define the GraphQL query for filtered transactions
const GET_TRANSACTIONS = gql`
  query GetTransactions($transactionType: String, $startDate: String, $endDate: String, $category: String) {
    transactions(transactionType: $transactionType, startDate: $startDate, endDate: $endDate, category: $category) {
      transactionID
      amount
      category
      transactionType
      timestamp
    }
  }
`;

// Service function to get transactions with filters
const getTransactions = async (filters) => {
  if (!ENABLE_GRAPHQL) return [];
  try {
    const response = await client.query({
      query: GET_TRANSACTIONS,
      variables: filters, // Pass filters as variables
    });
    return response.data.transactions; // Return the filtered transactions
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw new Error("Could not fetch transactions");
  }
};

export { getPublicKey, getTransactions };

export default getPublicKey;
