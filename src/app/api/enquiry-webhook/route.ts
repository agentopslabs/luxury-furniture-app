import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createContact } from "@/lib/ghl-actions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null) || await req.text().then(t => {
      try { return JSON.parse(t); } catch { return Object.fromEntries(new URLSearchParams(t)); }
    });

    // Extract contact fields from GHL webhook payload
    const firstName = body.first_name || body.firstName || body.contact?.firstName || "";
    const lastName  = body.last_name  || body.lastName  || body.contact?.lastName  || "";
    const email     = body.email || body.contact?.email || "";
    const phone     = body.phone || body.phone_number || body.contact?.phone || "";
    const message   = body.message || body.enquiry || body.notes || "";
    const fullName  = `${firstName} ${lastName}`.trim() || "Customer";

    // ── 1. Add / update contact in GHL ────────────────────────────────────────
    if (email || phone) {
      try {
        await createContact({
          firstName: firstName || undefined,
          lastName:  lastName  || undefined,
          email:     email     || undefined,
          phone:     phone     || undefined,
          source:    "Furniture Enquiry Form",
          tags:      ["enquiry", "website-form"],
        });
      } catch (e) {
        console.error("GHL createContact error:", e);
      }
    }

    // ── 2. Send emails via Gmail ───────────────────────────────────────────────
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const notifyEmail = process.env.NOTIFICATION_EMAIL || gmailUser;

    if (gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      });

      // Confirmation email to customer
      if (email) {
        await transporter.sendMail({
          from: `"Luxury Furniture" <${gmailUser}>`,
          to: email,
          subject: "Thank you for your enquiry — Luxury Furniture",
          html: `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0a0d14; color: #e8e8e8; border-radius: 12px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #1a2a4a 0%, #0d1a2e 100%); padding: 40px 32px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08);">
                <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #6366f1); border-radius: 10px; padding: 10px 14px; margin-bottom: 16px;">
                  <span style="color: white; font-weight: 800; font-size: 18px; letter-spacing: 1px;">LF</span>
                </div>
                <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">Luxury Furniture</h1>
                <p style="margin: 6px 0 0; color: rgba(255,255,255,0.4); font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Premium Collections</p>
              </div>
              <div style="padding: 36px 32px;">
                <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px;">Thank you, ${fullName}!</h2>
                <p style="color: rgba(255,255,255,0.6); line-height: 1.7; margin: 0 0 24px;">
                  We have received your furniture enquiry and our design consultant will get back to you within <strong style="color: #ffffff;">24 hours</strong>.
                </p>
                ${message ? `
                <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
                  <p style="color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Your Message</p>
                  <p style="color: rgba(255,255,255,0.75); margin: 0; line-height: 1.6; font-size: 14px;">${message}</p>
                </div>` : ""}
                <p style="color: rgba(255,255,255,0.6); line-height: 1.7; margin: 0 0 28px;">
                  In the meantime, browse our premium collections online or visit our showroom to experience our furniture in person.
                </p>
                <div style="text-align: center;">
                  <a href="#" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; padding: 13px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Visit Our Showroom</a>
                </div>
              </div>
              <div style="padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
                <p style="color: rgba(255,255,255,0.25); font-size: 12px; margin: 0;">© 2026 Luxury Furniture. All rights reserved.</p>
              </div>
            </div>`,
        });
      }

      // Internal notification to business owner
      if (notifyEmail) {
        await transporter.sendMail({
          from: `"Luxury Furniture CRM" <${gmailUser}>`,
          to: notifyEmail,
          subject: `New Enquiry: ${fullName}${email ? ` <${email}>` : ""}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 520px; background: #f9f9f9; border-radius: 8px; overflow: hidden; border: 1px solid #e5e5e5;">
              <div style="background: #1e3a5f; padding: 20px 24px;">
                <h2 style="color: white; margin: 0; font-size: 18px;">New Furniture Enquiry</h2>
                <p style="color: rgba(255,255,255,0.6); margin: 4px 0 0; font-size: 12px;">${new Date().toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}</p>
              </div>
              <div style="padding: 24px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 8px 0; color: #888; width: 120px;">Name</td><td style="padding: 8px 0; font-weight: 600; color: #111;">${fullName}</td></tr>
                  ${email ? `<tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0; color: #3b82f6;"><a href="mailto:${email}">${email}</a></td></tr>` : ""}
                  ${phone ? `<tr><td style="padding: 8px 0; color: #888;">Phone</td><td style="padding: 8px 0; color: #111;">${phone}</td></tr>` : ""}
                  ${message ? `<tr><td style="padding: 8px 0; color: #888; vertical-align: top;">Message</td><td style="padding: 8px 0; color: #444; line-height: 1.6;">${message}</td></tr>` : ""}
                </table>
                <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee;">
                  <p style="color: #888; font-size: 12px; margin: 0;">This contact has been automatically added to your CRM.</p>
                </div>
              </div>
            </div>`,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Enquiry webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Allow GET for webhook verification pings
export async function GET() {
  return NextResponse.json({ status: "Enquiry webhook active" });
}
