import mongoose from "mongoose";
import dotenv from "dotenv";
import { fetchAllData } from "../services/fetchData.js";
import MarketModel from "../models/marketModel.js";

dotenv.config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
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
    console.error("❌ Error:", err);
  } finally {
    mongoose.connection.close();
  }
}

main();
