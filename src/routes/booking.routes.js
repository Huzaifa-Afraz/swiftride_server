// import express from "express";
// import { authenticate, authorizeRoles } from "../middlewares/auth.middleware.js";
// import * as bookingController from "../controllers/booking.controller.js";
// import { validate } from "../middlewares/validation.middleware.js";
import {
  createBookingSchema,
  updateBookingStatusSchema
} from "../validations/booking.validation.js";
import express from "express";
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware.js";
import { requireKycApproved } from "../middlewares/kyc.middleware.js";
import * as bookingController from "../controllers/booking.controller.js";

const router = express.Router();

// const router = express.Router();

// Customer creates booking
router.post(
  "/",
  authenticate,
  authorizeRoles("customer"),
  validate(createBookingSchema),
  bookingController.createBooking
);

// Customer sees own bookings
router.get(
  "/me",
  authenticate,
  authorizeRoles("customer"),
  bookingController.getMyBookings
);

// Host / showroom sees bookings on their cars
router.get(
  "/owner",
  authenticate,
  authorizeRoles("host", "showroom"),
  bookingController.getOwnerBookings
);

// Host / showroom update booking status
router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("host", "showroom"),
  validate(updateBookingStatusSchema),
  bookingController.updateBookingStatus
);


// Customer creates booking
router.post(
  "/",
  authenticate,
  authorizeRoles("customer"),
  requireKycApproved,
  bookingController.createBooking
);

// Customer – my bookings
router.get(
  "/me",
  authenticate,
  authorizeRoles("customer"),
  bookingController.getMyBookings
);

// Host/Showroom – bookings for cars they own
router.get(
  "/owner",
  authenticate,
  authorizeRoles("host", "showroom"),
  bookingController.getOwnerBookings
);

// Host/Showroom – update booking status
router.patch(
  "/:bookingId/status",
  authenticate,
  authorizeRoles("host", "showroom"),
  bookingController.updateBookingStatus
);

export default router;
