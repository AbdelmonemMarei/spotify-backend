import express from "express";
import { getBatchedAlbumDetails } from "../controllers/albumController.js";

const router = express.Router();

router.get("/:id/batched", getBatchedAlbumDetails);

export default router;