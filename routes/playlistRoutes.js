import express from "express";
import { getPlaylistDetails, getPlaylistPreview } from "../controllers/playlistController.js";

const router = express.Router();

router.get("/:id", getPlaylistDetails);
router.get("/:id/preview", getPlaylistPreview);

export default router;
