import express from "express";
import {
  getMarkets,
  getCategories,
  getCategoryDetails,
  getPlaylists,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", getMarkets);
router.get("/:market/categories", getCategories);
router.get("/:market/categories/:id", getCategoryDetails);
router.get("/:market/categories/:id/playlists", getPlaylists);

export default router;
