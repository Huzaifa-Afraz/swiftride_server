import transporter from "../config/email.js";

const fromAddress =
  process.env.EMAIL_FROM || "SwiftRide <no-reply@swiftride.com>";
const adminEmail =
  process.env.ADMIN_NOTIFICATION_EMAIL || "huzaifaafraz90@gmail.com";

export const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    html
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

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(
    token
  )}`;

  const subject = "Reset your SwiftRide password";

  const html = `
    <div style="font-family: Arial, sans-serif; color:#222;">
      <h2>Reset your password</h2>

      <p>Dear ${user.fullName || "SwiftRide user"},</p>

      <p>We received a request to reset the password for your SwiftRide account.</p>

      <p>
        Click the button below (or use the link) to set a new password. This link
        will be valid for <strong>1 hour</strong>.
      </p>

      <p style="margin:20px 0;">
        <a href="${resetLink}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:4px;text-decoration:none;">
          Reset Password
        </a>
      </p>

      <p>Or copy this link into your browser:</p>
      <p style="word-break:break-all; font-size:13px; color:#555;">${resetLink}</p>

      <p style="margin-top:16px;">
        If you did not request a password reset, you can safely ignore this email.
      </p>

      <p style="margin-top:24px;">
        Regards,<br/>
        <strong>SwiftRide Team</strong>
      </p>

      <p style="margin-top:24px; font-size:12px; color:#888;">
        This is an automated message, please do not reply.
      </p>
    </div>
  `;

  await sendEmail({ to: user.email, subject, html });
};
