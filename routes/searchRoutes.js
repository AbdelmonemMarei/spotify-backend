import express from "express";
import { getBatchedTracksBySearch } from "../controllers/searchController.js";
const router = express.Router();

router.get("/tracks/:query", getBatchedTracksBySearch);

export default router;