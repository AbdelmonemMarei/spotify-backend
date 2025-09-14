import mongoose from "mongoose";
// import dotenv from "dotenv";
import { fetchAllData } from "../services/fetchData.js";
import MarketModel from "../models/marketModel.js";

// dotenv.config();

async function main() {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error("MONGO_URI is not defined in environment variables!");
    }

    if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
      throw new Error(`Invalid MONGO_URI format: ${uri}`);
    }

    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    const data = await fetchAllData();
    for (const market of data) {
      await MarketModel.updateOne(
        { market: market.market },
        { $set: market },
        { upsert: true }
      );
    }

    console.log("✅ Data saved to MongoDB");
  } catch (err) {
    console.error("❌ Error:", err.message || err);
  } finally {
    mongoose.connection.close();
  }
}

main();

