import express from "express";
import { getPlaylistDetails } from "../controllers/playlistController.js";

const router = express.Router();

router.get("/:id", getPlaylistDetails);

export default router;
