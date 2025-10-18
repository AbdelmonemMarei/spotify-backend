
import express from "express";
import {
  getSectionsByCategory,
  getRandomSections,
  getSectionDetails,
  getMarketSections
} from "../controllers/sectionController.js";

const router = express.Router();


router.get("/:market/categories/:id/sections", getSectionsByCategory);
router.get("/:market/sections/random", getRandomSections);
router.get("/:market/sections/:id", getSectionDetails);
router.get("/:market/sections", getMarketSections);


export default router;