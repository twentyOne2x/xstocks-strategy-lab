import { Router } from "express";
import { triggers, actions } from "@xstocks/workflow-shared";

export const registryRouter = Router();

registryRouter.get("/triggers", (_req, res) => {
  res.json(triggers);
});

registryRouter.get("/actions", (_req, res) => {
  res.json(actions);
});
