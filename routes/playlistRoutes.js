import express from "express";
import { getPlaylistDetails, getPlaylistPreview, getBatchedPlaylistDetails } from "../controllers/playlistController.js";

const router = express.Router();

router.get("/:id", getPlaylistDetails);
router.get("/:id/preview", getPlaylistPreview);
router.get("/:id/batched", getBatchedPlaylistDetails);

export default router;
