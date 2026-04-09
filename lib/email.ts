import { Resend } from "resend";
import { Booking, DeskAssignment } from "@/types";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  return new Resend(key);
}

const FROM = () => process.env.RESEND_FROM_EMAIL ?? "noreply@yourdomain.com";
const ADMIN_EMAIL = () => process.env.ADMIN_EMAIL ?? "";
const BASE_URL = () => process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

// ── Sent to admin when a new booking is submitted ──────────────────────────
export async function sendAdminNotification(booking: Booking) {
  const resend = getResend();
  const adminDashboardUrl = `${BASE_URL()}/admin/dashboard/${booking.id}`;
  const formattedDate = new Date(booking.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  await resend.emails.send({
    from: FROM(),
    to: ADMIN_EMAIL(),
    subject: `New Booking Request — ${booking.name} from ${booking.company} (${formattedDate})`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#4f46e5;">New Booking Request</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#6b7280;width:140px;">Visitor</td><td style="padding:8px 0;font-weight:600;">${booking.name}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Company</td><td style="padding:8px 0;">${booking.company}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Purpose</td><td style="padding:8px 0;">${booking.purpose}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Phone</td><td style="padding:8px 0;">${booking.phone}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;">${booking.email}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Date</td><td style="padding:8px 0;">${formattedDate}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Guests</td><td style="padding:8px 0;">${booking.num_guests}</td></tr>
        </table>
        <a href="${adminDashboardUrl}" style="display:inline-block;margin-top:24px;background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          Review &amp; Confirm Booking
        </a>
      </div>
    `,
  });
}

// ── Sent to visitor when admin confirms ────────────────────────────────────
export async function sendVisitorConfirmation(
  booking: Booking,
  assignments: DeskAssignment[]
) {
  const resend = getResend();
  const bookingUrl = `${BASE_URL()}/booking/${booking.id}`;
  const formattedDate = new Date(booking.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const deskList = assignments.map((a) => a.desk?.name ?? `Desk #${a.desk_id}`).join(", ");

  await resend.emails.send({
    from: FROM(),
    to: booking.email,
    subject: `Your Visit is Confirmed — ${formattedDate}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#16a34a;">Your Booking is Confirmed!</h2>
        <p>Hi ${booking.name}, your office visit has been confirmed. Here are the details:</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#6b7280;width:140px;">Date</td><td style="padding:8px 0;font-weight:600;">${formattedDate}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Guests</td><td style="padding:8px 0;">${booking.num_guests}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Assigned Desks</td><td style="padding:8px 0;font-weight:600;">${deskList}</td></tr>
          ${booking.admin_notes ? `<tr><td style="padding:8px 0;color:#6b7280;">Note</td><td style="padding:8px 0;">${booking.admin_notes}</td></tr>` : ""}
        </table>
        <p style="color:#4b5563;font-size:14px;">You can also reserve the meeting room for your visit date using the link below.</p>
        <a href="${bookingUrl}" style="display:inline-block;margin-top:8px;background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          View Booking &amp; Book Meeting Room
        </a>
      </div>
    `,
  });
}
