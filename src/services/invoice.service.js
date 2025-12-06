import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const brandName = process.env.INVOICE_BRAND_NAME || "SwiftRide";
const ownerName = process.env.OWNER_NAME || "Mudassar Afraz";
const brandAddress =
  process.env.INVOICE_BRAND_ADDRESS || "Islamabad, Pakistan";
const brandPhone = process.env.INVOICE_BRAND_PHONE || "+92-300-0000000";

export const generateInvoicePDF = (booking, car, customer, owner) => {
  const invoicesDir = path.join("uploads", "invoices");
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
  }

  const fileName = `${booking.invoiceNumber || booking._id}.pdf`;
  const pdfPath = path.join(invoicesDir, fileName);

  const doc = new PDFDocument({ margin: 50, size: "A4" });

  const logoPath = path.join("public", "logo.png");
  const signaturePath = path.join("public", "signature.png");

  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  // Watermark (owner name)
  doc
    .fontSize(60)
    .fillColor("#dddddd")
    .opacity(0.2)
    .rotate(30, { origin: [250, 300] })
    .text(ownerName, 50, 250, { align: "center" })
    .rotate(-30, { origin: [250, 300] })
    .opacity(1)
    .fillColor("#000000");

  // Header
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

  doc
    .moveTo(50, 110)
    .lineTo(550, 110)
    .strokeColor("#cccccc")
    .stroke();

  // Invoice title and meta
  doc
    .fontSize(18)
    .fillColor("#111111")
    .text("Booking Invoice", 50, 125);

  doc
    .fontSize(11)
    .fillColor("#333333")
    .text(`Invoice #: ${booking.invoiceNumber}`, 50, 150)
    .text(`Invoice Date: ${new Date().toLocaleDateString()}`, 50, 165)
    .text(`Booking ID: ${booking._id}`, 50, 180);

  // Customer & Owner
  const topBlock = 210;
  doc
    .fontSize(12)
    .fillColor("#111111")
    .text("Bill To:", 50, topBlock);
  doc
    .fontSize(11)
    .fillColor("#333333")
    .text(customer.fullName || "-", 50, topBlock + 15)
    .text(customer.email || "-", 50, topBlock + 30);

  doc
    .fontSize(12)
    .fillColor("#111111")
    .text("Host / Showroom:", 320, topBlock);
  doc
    .fontSize(11)
    .fillColor("#333333")
    .text(owner.fullName || "-", 320, topBlock + 15)
    .text(owner.email || "-", 320, topBlock + 30);

  // Car details
  const carBlockTop = topBlock + 70;
  doc
    .fontSize(12)
    .fillColor("#111111")
    .text("Car Details", 50, carBlockTop);
  doc
    .fontSize(11)
    .fillColor("#333333")
    .text(`Car: ${car.brand} ${car.model} ${car.year}`, 50, carBlockTop + 15)
    .text(`Location: ${car.location}`, 50, carBlockTop + 30)
    .text(
      `Daily Price: ${booking.currency} ${car.dailyPrice}`,
      50,
      carBlockTop + 45
    );

  // Booking details
  const bookBlockTop = carBlockTop + 80;
  doc
    .fontSize(12)
    .fillColor("#111111")
    .text("Booking Summary", 50, bookBlockTop);
  doc
    .fontSize(11)
    .fillColor("#333333")
    .text(
      `Start: ${booking.startDateTime.toLocaleString()}`,
      50,
      bookBlockTop + 15
    )
    .text(
      `End: ${booking.endDateTime.toLocaleString()}`,
      50,
      bookBlockTop + 30
    )
    .text(
      `Duration: ${booking.durationHours} hours`,
      50,
      bookBlockTop + 45
    );

  // Amount table
  const tableTop = bookBlockTop + 80;
  doc
    .fontSize(12)
    .fillColor("#111111")
    .text("Charges", 50, tableTop);

  doc
    .fontSize(11)
    .fillColor("#333333")
    .text("Description", 50, tableTop + 20)
    .text("Hours", 300, tableTop + 20)
    .text("Amount", 400, tableTop + 20);

  doc
    .moveTo(50, tableTop + 35)
    .lineTo(550, tableTop + 35)
    .strokeColor("#cccccc")
    .stroke();

  const baseY = tableTop + 45;
  doc
    .fontSize(11)
    .fillColor("#333333")
    .text("Car Rental", 50, baseY)
    .text(`${booking.durationHours}`, 300, baseY)
    .text(
      `${booking.currency} ${booking.totalPrice.toFixed(0)}`,
      400,
      baseY
    );

  // Total
  doc
    .moveTo(300, baseY + 25)
    .lineTo(550, baseY + 25)
    .strokeColor("#cccccc")
    .stroke();

  doc
    .fontSize(12)
    .fillColor("#111111")
    .text("Total:", 300, baseY + 35)
    .fontSize(12)
    .fillColor("#111111")
    .text(
      `${booking.currency} ${booking.totalPrice.toFixed(0)}`,
      400,
      baseY + 35
    );

  // Footer / terms
  const footerTop = baseY + 80;
  doc
    .fontSize(10)
    .fillColor("#777777")
    .text(
      "Note: Please bring your original CNIC/ID and driving license at the time of vehicle handover.",
      50,
      footerTop,
      { width: 500 }
    )
    .moveDown()
    .text(
      "By proceeding with this booking, you agree to SwiftRide's rental terms and conditions.",
      { width: 500 }
    );

  // Signature (optional)
  if (fs.existsSync(signaturePath)) {
    doc.image(signaturePath, 400, footerTop + 60, { width: 100 });
    doc
      .fontSize(10)
      .fillColor("#555555")
      .text(ownerName, 400, footerTop + 120);
  }

  doc.end();

  return pdfPath;
};
