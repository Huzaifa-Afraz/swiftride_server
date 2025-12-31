import transporter from "../config/email.js";

const fromAddress =
  process.env.EMAIL_FROM || "SwiftRide <no-reply@swiftride.com>";
const adminEmail =
  process.env.ADMIN_NOTIFICATION_EMAIL || "huzaifaafraz90@gmail.com";

// export const sendEmail = async ({ to, subject, html }) => {
//   const mailOptions = {
//     from: fromAddress,
//     to,
//     subject,
//     html
//   };
export const sendEmail = async ({ to, subject, html, attachments }) => {
  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    html,
    attachments // can be undefined
  };

  await transporter.sendMail(mailOptions);
};




/**
 * ADMIN NOTIFICATION – new registration
 */
export const sendAdminNewUserEmail = async (user) => {
  if (!user) return;

  const roleLabel = user.role?.toUpperCase() || "USER";

  const subject = `New ${roleLabel} registration – SwiftRide`;

  const html = `
    <div style="font-family: Arial, sans-serif; color:#222;">
      <h2>New ${roleLabel} Registered</h2>
      <p>A new user has registered on <strong>SwiftRide</strong>.</p>

      <table style="border-collapse:collapse; margin-top:10px;">
        <tr><td style="padding:4px 8px;"><strong>Name:</strong></td><td style="padding:4px 8px;">${user.fullName || "-"}</td></tr>
        <tr><td style="padding:4px 8px;"><strong>Email:</strong></td><td style="padding:4px 8px;">${user.email || "-"}</td></tr>
        <tr><td style="padding:4px 8px;"><strong>Phone:</strong></td><td style="padding:4px 8px;">${user.phoneNumber || "-"}</td></tr>
        <tr><td style="padding:4px 8px;"><strong>Role:</strong></td><td style="padding:4px 8px;">${user.role}</td></tr>
      </table>

      <p style="margin-top:16px;">
        You can review their KYC submissions from the admin dashboard when available.
      </p>

      <p style="margin-top:24px; font-size:12px; color:#888;">
        This is an automated notification from SwiftRide.
      </p>
    </div>
  `;

  await sendEmail({ to: adminEmail, subject, html });
};

/**
 * USER NOTIFICATION – KYC approved / rejected
 */
export const sendKycStatusEmail = async ({ user, kyc, status, reason }) => {
  if (!user || !user.email) return;

  const prettyStatus = status === "approved" ? "Approved" : "Rejected";
  const subject = `Your KYC has been ${prettyStatus} – SwiftRide`;

  const kycTypeLabel =
    kyc?.type === "showroom" ? "Showroom KYC" : "Account KYC";

  const statusColor = status === "approved" ? "#16a34a" : "#dc2626";

  const html = `
    <div style="font-family: Arial, sans-serif; color:#222;">
      <h2 style="color:${statusColor};">${prettyStatus}: ${kycTypeLabel}</h2>

      <p>Dear ${user.fullName || "SwiftRide user"},</p>

      ${
        status === "approved"
          ? `<p>Good news! Your ${kycTypeLabel.toLowerCase()} has been <strong>approved</strong>. You can now fully use SwiftRide features related to your role.</p>`
          : `<p>Your ${kycTypeLabel.toLowerCase()} has been <strong>rejected</strong>.</p>
             ${
               reason
                 ? `<p><strong>Reason:</strong> ${reason}</p>`
                 : `<p>Please review your documents and submit them again with clearer information.</p>`
             }`
      }

      <p style="margin-top:16px;">
        If you have any questions, you can reply to this email or contact our support.
      </p>

      <p style="margin-top:24px;">
        Regards,<br/>
        <strong>SwiftRide Team</strong>
      </p>

      <p style="margin-top:24px; font-size:12px; color:#888;">
        This is an automated message. Please do not share your login details with anyone.
      </p>
    </div>
  `;

  await sendEmail({ to: user.email, subject, html });
};

/**
 * USER NOTIFICATION – Password reset link
 */
export const sendPasswordResetEmail = async (user, token) => {
  if (!user || !user.email) return;

  const subject = "Reset your SwiftRide password";

  const html = `
    <div style="font-family: Arial, sans-serif; color:#222; max-width: 600px; margin: 0 auto;">
      <h2>Reset your password</h2>

      <p>Dear ${user.fullName || "SwiftRide user"},</p>

      <p>We received a request to reset the password for your SwiftRide account.</p>

      <p>Use the following code to reset your password. This code is valid for <strong>1 hour</strong>.</p>

      <div style="margin: 24px 0; text-align: center;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #2563eb; background: #f0fdf4; padding: 12px 24px; border-radius: 8px; border: 1px dashed #2563eb;">
          ${token}
        </span>
      </div>

      <p>Enter this code in the app to proceed.</p>

      <p style="margin-top:24px; font-size:12px; color:#888;">
        If you did not request a password reset, you can safely ignore this email.
      </p>

      <p style="margin-top:24px;">
        Regards,<br/>
        <strong>SwiftRide Team</strong>
      </p>
    </div>
  `;

  await sendEmail({ to: user.email, subject, html });
};



export const sendBookingInvoiceEmail = async (
  customer,
  booking,
  pdfPath
) => {
  if (!customer?.email) return;

  const subject = `Your SwiftRide booking invoice – ${booking.invoiceNumber}`;

  const html = `
    <div style="font-family: Arial, sans-serif; color:#222;">
      <h2>SwiftRide Booking Confirmed</h2>
      <p>Dear ${customer.fullName || "customer"},</p>
      <p>Your booking has been <strong>confirmed</strong>. Please find your invoice attached as a PDF.</p>
      <p>
        <strong>Invoice #:</strong> ${booking.invoiceNumber}<br/>
        <strong>Booking ID:</strong> ${booking._id}<br/>
        <strong>Total:</strong> ${booking.currency} ${booking.totalPrice.toFixed(0)}
      </p>
      <p style="margin-top:16px;">
        Please bring your original documents at the time of vehicle handover.
      </p>
      <p style="margin-top:24px;">
        Regards,<br/>
        <strong>SwiftRide Team</strong>
      </p>
    </div>
  `;

  await sendEmail({
    to: customer.email,
    subject,
    html,
    attachments: [
      {
        filename: `${booking.invoiceNumber}.pdf`,
        path: pdfPath
      }
    ]
  });
};

/**
 * USER NOTIFICATION - Google Login Reminder (No Password)
 */
export const sendGoogleLoginReminderEmail = async (user) => {
  if (!user || !user.email) return;

  const subject = "Reset Password - Google Account";

  const html = `
    <div style="font-family: Arial, sans-serif; color:#222; max-width: 600px; margin: 0 auto;">
      <h2>Log in with Google</h2>

      <p>Dear ${user.fullName || "SwiftRide user"},</p>

      <p>We received a request to reset the password for your SwiftRide account.</p>

      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="margin: 0; color: #334155;">
          <strong>Note:</strong> Your account is linked to your <strong>Google Account</strong>. You don't have a separate password to reset.
        </p>
      </div>

      <p>Please log in using the <strong>"Continue with Google"</strong> button in the app.</p>

      <p style="margin-top:24px; font-size:12px; color:#888;">
        If you are having trouble, please contact support.
      </p>

      <p style="margin-top:24px;">
        Regards,<br/>
        <strong>SwiftRide Team</strong>
      </p>
    </div>
  `;

  await sendEmail({ to: user.email, subject, html });
};
