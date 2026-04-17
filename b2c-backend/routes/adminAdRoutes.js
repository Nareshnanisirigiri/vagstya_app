import { Router } from "express";
import { adController } from "../converted-http/Controllers/Admin/AdController.js";

export const adminAdRoutes = Router();

adminAdRoutes.get("/", (req, res) => adController.index(req, res));
adminAdRoutes.get("/create", (req, res) => adController.create(req, res));
adminAdRoutes.post("/", (req, res) => adController.store(req, res));
adminAdRoutes.get("/:id/edit", (req, res) => adController.edit(req, res));
adminAdRoutes.put("/:id", (req, res) => adController.update(req, res));
adminAdRoutes.patch("/:id/status", (req, res) => adController.statusToggle(req, res));
adminAdRoutes.delete("/:id", (req, res) => adController.destroy(req, res));
