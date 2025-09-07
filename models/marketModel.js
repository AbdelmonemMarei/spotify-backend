import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({}, { strict: false });

const MarketSchema = new mongoose.Schema(
  {
    market: String,
    categories: [CategorySchema],
  },
  { strict: false }
);

const MarketModel = mongoose.model("Market", MarketSchema);

export default MarketModel;
