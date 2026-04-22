import express from "express";
import { getCategories } from "../Controllers/categoryController.js";

const router = express.Router();

router.get("/", getCategories);

export { router as categoryRoutes };
