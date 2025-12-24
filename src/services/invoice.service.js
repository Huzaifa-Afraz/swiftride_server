import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

// Ensure Cloudinary is configured
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const brandName = process.env.INVOICE_BRAND_NAME || "SwiftRide";
const ownerName = process.env.OWNER_NAME || "Huzaifa Afraz";
const brandAddress = process.env.INVOICE_BRAND_ADDRESS || "Islamabad, Pakistan";
const brandPhone = process.env.INVOICE_BRAND_PHONE || "+92-300-0000000";

// NOTE: This function is now ASYNC because uploading takes time.
// You must use 'await generateInvoicePDF(...)' in your controller.
export const generateInvoicePDF = (booking, car, customer, owner) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });

      // 1. Create Cloudinary Upload Stream
      // We pipe the PDF directly to Cloudinary, skipping local disk storage.
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "invoices",
          format: "pdf", // Force PDF format
          public_id: `invoice_${booking.invoiceNumber || booking._id}`,
          resource_type: "auto", // Automatically detect file type
        },
        (error, result) => {
          if (error) {
            console.error("PDF Upload Error:", error);
            return reject(error);
          }
          // Resolve with the Secure Cloudinary URL
          resolve(result.secure_url);
        }
      );

      // Pipe document to Cloudinary
      doc.pipe(uploadStream);

      // 2. Setup Asset Paths (Safe for Vercel)
      const logoPath = path.join(process.cwd(), "public", "logo.png");
      const signaturePath = path.join(process.cwd(), "public", "signature.png");

      // ===============================================
      // 3. Watermark (Background)
      // ===============================================
      doc
        .fontSize(60)
        .fillColor("#dddddd")
        .opacity(0.1)
        .rotate(30, { origin: [250, 300] })
        .text(ownerName, 50, 250, { align: "center" })
        .rotate(-30, { origin: [250, 300] })
        .opacity(1);

      // ===============================================
      // 4. Header & Branding
      // ===============================================
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 40, { width: 80 });
      }

      doc
        .fontSize(22)
        .fillColor("#111111")
        .text(brandName, 150, 50)
        .fontSize(10)
        .fillColor("#555555")
        .text(brandAddress, 150, 75)
        .text(`Phone: ${brandPhone}`, 150, 90);

      // ===============================================
      // 5. PAID STAMP (Professional)
      // ===============================================
      if (booking.paymentStatus === "paid") {
        const stampX = 420;
        const stampY = 50;

        doc.save();
        doc.translate(stampX, stampY);
        doc.rotate(-10);

        // Draw Box
        doc
          .roundedRect(0, 0, 120, 50, 4)
          .lineWidth(3)
          .strokeOpacity(0.8)
          .strokeColor("#228B22")
          .stroke();

        // Draw Text
        doc
          .fontSize(24)
          .font("Helvetica-Bold")
          .fillColor("#228B22")
          .fillOpacity(0.8)
          .text("PAID", 0, 8, { width: 120, align: "center" });

        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#228B22")
          .text("by SwiftRide", 0, 32, { width: 120, align: "center" });

        doc.restore();
      }

      // Separator Line
      doc
        .moveTo(50, 110)
        .lineTo(550, 110)
        .strokeColor("#cccccc")
        .lineWidth(1)
        .stroke();

      // ===============================================
      // 6. Invoice Details
      // ===============================================
      doc.fontSize(18).fillColor("#111111").text("Booking Invoice", 50, 125);

      doc
        .fontSize(11)
        .fillColor("#333333")
        .text(`Invoice #: ${booking.invoiceNumber || "-"}`, 50, 150)
        .text(`Invoice Date: ${new Date().toLocaleDateString()}`, 50, 165)
        .text(`Booking ID: ${booking._id}`, 50, 180);

      // ===============================================
      // 7. Customer & Owner
      // ===============================================
      const topBlock = 210;

      doc
        .fontSize(12)
        .fillColor("#111111")
        .font("Helvetica-Bold")
        .text("Bill To:", 50, topBlock);
      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#333333")
        .text(customer.fullName || "-", 50, topBlock + 20)
        .text(customer.email || "-", 50, topBlock + 35);

      doc
        .fontSize(12)
        .fillColor("#111111")
        .font("Helvetica-Bold")
        .text("Host / Showroom:", 320, topBlock);
      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#333333")
        .text(owner.fullName || "-", 320, topBlock + 20)
        .text(owner.email || "-", 320, topBlock + 35);

      // ===============================================
      // 8. Car & Booking Info
      // ===============================================
      const carBlockTop = topBlock + 80;
      doc
        .fontSize(12)
        .fillColor("#111111")
        .font("Helvetica-Bold")
        .text("Vehicle Details", 50, carBlockTop);

      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#333333")
        .text(
          `Car: ${car.make} ${car.model} ${car.year}`,
          50,
          carBlockTop + 20
        )
        .text(
          `Location: ${car.location?.address || "-"}`,
          50,
          carBlockTop + 35
        );

      const bookBlockTop = carBlockTop + 90;
      doc
        .fontSize(12)
        .fillColor("#111111")
        .font("Helvetica-Bold")
        .text("Booking Summary", 50, bookBlockTop);

      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#333333")
        .text(
          `Start: ${new Date(booking.startDateTime).toLocaleString()}`,
          50,
          bookBlockTop + 20
        )
        .text(
          `End: ${new Date(booking.endDateTime).toLocaleString()}`,
          50,
          bookBlockTop + 35
        )
        .text(
          `Duration: ${booking.durationHours} hours`,
          50,
          bookBlockTop + 50
        );

      // ===============================================
      // 9. Charges Table
      // ===============================================
      const tableTop = bookBlockTop + 90;

      doc
        .fontSize(12)
        .fillColor("#111111")
        .font("Helvetica-Bold")
        .text("Description", 50, tableTop)
        .text("Qty/Hrs", 300, tableTop)
        .text("Amount", 450, tableTop);

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .strokeColor("#cccccc")
        .stroke();

      const baseY = tableTop + 30;
      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#333333")
        .text("Car Rental Charges", 50, baseY)
        .text(`${booking.durationHours}`, 300, baseY)
        .text(
          `${booking.currency} ${booking.totalPrice.toFixed(0)}`,
          450,
          baseY
        );

      // Total Line
      doc
        .moveTo(300, baseY + 25)
        .lineTo(550, baseY + 25)
        .strokeColor("#cccccc")
        .stroke();

      // Total Amount
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#111111")
        .text("Total:", 300, baseY + 35)
        .fontSize(14)
        .text(
          `${booking.currency} ${booking.totalPrice.toFixed(0)}`,
          450,
          baseY + 35
        );

      // ===============================================
      // 10. Footer
      // ===============================================
      const footerTop = baseY + 100;

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#777777")
        .text(
          "Note: Please bring original ID and license at vehicle handover.",
          50,
          footerTop,
          { width: 300 }
        )
        .moveDown(0.5)
        .text(
          "By booking, you agree to SwiftRide terms.",
          { width: 300 }
        );

      if (fs.existsSync(signaturePath)) {
        doc.image(signaturePath, 400, footerTop - 10, { width: 100 });
        doc
          .fontSize(10)
          .fillColor("#555555")
          .text(ownerName, 420, footerTop + 50);
      }

      // Finalize the PDF file (flushes stream to Cloudinary)
      doc.end();

    } catch (err) {
      reject(err);
    }
  });
};