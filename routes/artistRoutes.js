import express from "express";
import { getBatchedArtistDetails } from "../controllers/artistController.js";

const router = express.Router();

router.get("/:id/batched", getBatchedArtistDetails);

export default router;