import { Router } from "express";
import {
  getRegistrations,
  getRegistrationsByEmail,
  createRegistration,
} from "../controllers/registration.controller";

const router = Router();

router.get("/", getRegistrations);
router.get("/:email", getRegistrationsByEmail);
router.post("/", createRegistration);

export default router;
