import express from "express";
import { getTrackDetails } from "../controllers/trackController.js";

const router = express.Router();

router.get("/:id", getTrackDetails);

export default router;