import express from "express";
import * as kycController from "../controllers/kyc.controller.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware.js";
import { kycUpload } from "../config/multer.js";

const router = express.Router();

// Individual KYC (customer / host)
router.post(
  "/user",
  authenticate,
  authorizeRoles("customer", "host"),
  kycUpload.fields([
    { name: "id_front", maxCount: 1 },
    { name: "id_back", maxCount: 1 },
    { name: "live_selfie", maxCount: 1 },
    { name: "driving_license", maxCount: 1 } // NOTE: field name
  ]),
  kycController.submitUserKyc
);

// Showroom KYC
router.post(
  "/showroom",
  authenticate,
  authorizeRoles("showroom"),
  kycUpload.fields([
    { name: "id_front", maxCount: 1 },
    { name: "id_back", maxCount: 1 },
    { name: "live_selfie", maxCount: 1 },
    { name: "registration_cert", maxCount: 1 },
    { name: "tax_cert", maxCount: 1 },
    { name: "other_doc", maxCount: 1 }
  ]),
  kycController.submitShowroomKyc
);

router.get(
  "/status",
  authenticate,
  kycController.getMyKyc
);
export default router;
