import mongoose from "mongoose";

const kycSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // "individual" for customer/host, "showroom" for showroom registrations
    type: {
      type: String,
      enum: ["individual", "showroom"],
      required: true
    },

    // Common documents
    idFrontPath: {
      type: String,
      required: true
    },
    idBackPath: {
      type: String,
      required: true
    },
    liveSelfiePath: {
      type: String,
      required: true
    },

    // Only for individual (customer/host). Required for CUSTOMER is enforced in service.
    drivingLicensePath: {
      type: String
    },

    // Only for showroom KYC
    showroomDocs: {
      registrationCertPath: {
        type: String
      },
      taxCertPath: {
        type: String
      },
      otherDocPath: {
        type: String
      }
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export const Kyc = mongoose.model("Kyc", kycSchema);
