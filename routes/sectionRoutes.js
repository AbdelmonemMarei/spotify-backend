
import express from "express";
import {
  getSectionsByCategory,
  getRandomSections,
  getSectionDetails,
} from "../controllers/sectionController.js";

const router = express.Router();


router.get("/:market/categories/:id/sections", getSectionsByCategory);
router.get("/:market/sections/random", getRandomSections);
router.get("/sections/:id", getSectionDetails);


export default router;