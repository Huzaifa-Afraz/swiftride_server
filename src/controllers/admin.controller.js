import catchAsync from "../utils/catchAsync.js";
import httpStatus from "http-status";
import { sendSuccessResponse } from "../utils/response.js";
import * as adminService from "../services/admin.service.js";
import { sendKycStatusEmail } from "../utils/email.js";
import { Booking } from "../models/booking.model.js";


// helper dto functions
const mapBookingSummaryDTO = (booking) => {
  return {
    id: booking._id,
    invoiceNumber: booking.invoiceNumber,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    startDateTime: booking.startDateTime,
    endDateTime: booking.endDateTime,
    durationHours: booking.durationHours,
    totalPrice: booking.totalPrice,
    currency: booking.currency,

    car: booking.car
      ? {
          id: booking.car._id,
          make: booking.car.make,
          model: booking.car.model,
          year: booking.car.year,
          primaryPhoto:
            booking.car.photos && booking.car.photos.length > 0
              ? booking.car.photos[0]
              : null,
          location: booking.car.location || null
        }
      : null,

    customer: booking.customer
      ? {
          id: booking.customer._id,
          name: booking.customer.fullName,
          email: booking.customer.email,
          role: booking.customer.role
        }
      : null,

    owner: booking.owner
      ? {
          id: booking.owner._id,
          name: booking.owner.fullName,
          email: booking.owner.email,
          role: booking.owner.role
        }
      : null,

    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt
  };
};

// const mapBookingDetailDTO = (booking) => {
//   const base = mapBookingSummaryDTO(booking);

//   return {
//     ...base,
//     platformCommissionPercent: booking.platformCommissionPercent,
//     platformCommissionAmount: booking.platformCommissionAmount,
//     ownerEarningAmount: booking.ownerEarningAmount,
//     isPaid: booking.paymentStatus === "paid",
//     invoicePdfPath: booking.pdfPath || null,
//     invoiceDownloadPath: booking._id
//       ? `/api/bookings/invoice/${booking._id}`
//       : null,
//     statusTimeline: (booking.statusHistory || []).map((h) => ({
//       status: h.status,
//       changedAt: h.changedAt,
//       changedBy: h.changedBy,
//       note: h.note
//     }))
//   };
// };





// export const getAllKyc = catchAsync(async (req, res) => {
//   const { status, type, page, limit } = req.query;

//   const result = await adminService.listKyc({
//     status,
//     type,
//     page,
//     limit
//   });

//   sendSuccessResponse(res, httpStatus.OK, "KYC records fetched", result);
// });

export const getAllKyc = catchAsync(async (req, res) => {
  const { status, type, page, limit, q } = req.query;

  const result = await adminService.listKyc({
    status,
    type,
    page,
    limit,
    q
  });

  sendSuccessResponse(res, httpStatus.OK, "KYC records fetched", result);
});



export const approveKyc = catchAsync(async (req, res) => {
  const { kycId } = req.params;

  const { kyc, user } = await adminService.approveKyc(kycId);

  (async () => {
    try {
      await sendKycStatusEmail({ user, kyc, status: "approved" });
    } catch (err) {
      console.error("Error sending KYC approval email:", err.message);
    }
  })();

  sendSuccessResponse(res, httpStatus.OK, "KYC approved successfully", {
    kyc
  });
});

export const rejectKyc = catchAsync(async (req, res) => {
  const { kycId } = req.params;
  const { reason } = req.body;

  const { kyc, user } = await adminService.rejectKyc(kycId, reason);

  (async () => {
    try {
      await sendKycStatusEmail({
        user,
        kyc,
        status: "rejected",
        reason
      });
    } catch (err) {
      console.error("Error sending KYC rejection email:", err.message);
    }
  })();

  sendSuccessResponse(res, httpStatus.OK, "KYC rejected", { kyc });
});



export const getAllBookings = catchAsync(async (req, res) => {
  const { status, paymentStatus, ownerId, customerId, ownerRole, fromDate, toDate, q, page, limit } =
    req.query;

  const result = await adminService.listBookings({
    status,
    paymentStatus,
    ownerId,
    customerId,
    ownerRole,
    fromDate,
    toDate,
    q,
    page,
    limit
  });

  const mapped = result.data.map(mapBookingSummaryDTO);

  sendSuccessResponse(res, httpStatus.OK, "Bookings fetched", {
    items: mapped,
    page: result.page,
    total: result.total,
    totalPages: result.totalPages
  });
});

export const getBookingDetail = catchAsync(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await adminService.getBookingByIdForAdmin(bookingId);

  const mapped = mapBookingDetailDTO(booking);

  sendSuccessResponse(res, httpStatus.OK, "Booking detail fetched", {
    booking: mapped
  });
});
