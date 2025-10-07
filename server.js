import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./utils/db.js";
import sectionRoutes from "./routes/sectionRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import playlistRoutes from "./routes/playlistRoutes.js";
import albumRoutes from "./routes/albumRoutes.js";
import artistRoutes from "./routes/artistRoutes.js";
import trackRoutes from "./routes/trackRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

// Routes
app.use("/api/category", categoryRoutes);
app.use("/api/section", sectionRoutes);
app.use("/api/playlist", playlistRoutes);
app.use("/api/album", albumRoutes);
app.use("/api/artist", artistRoutes);
app.use("/api/track", trackRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
