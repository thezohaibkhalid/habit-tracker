import nodemailer from "nodemailer"

const SMTP_USER = process.env.SMTP_USER || "zohaibkhalid.pk@gmail.com"
const SMTP_PASS = process.env.SMTP_PASS || "kyvt sdfs rtea hsfe"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
})

export async function sendOTPEmail(email: string, otp: string, name?: string) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - Bit Habits</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Bit Habits
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 24px; font-weight: 600;">
                Password Reset Request
              </h2>
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                ${name ? `Hi ${name},` : "Hello,"}
              </p>
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Use the verification code below to proceed:
              </p>
              
              <!-- OTP Box -->
              <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 24px; text-align: center; margin: 32px 0;">
                <p style="margin: 0 0 12px; color: #64748b; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                  Verification Code
                </p>
                <p style="margin: 0; color: #0f172a; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </p>
              </div>
              
              <p style="margin: 24px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                This code will expire in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.6;">
                © ${new Date().getFullYear()} Bit Habits. All rights reserved.<br>
                This is an automated email, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  const text = `
Bit Habits - Password Reset

Hi${name ? ` ${name}` : ""},

We received a request to reset your password. Use the verification code below to proceed:

Verification Code: ${otp}

This code will expire in 10 minutes. If you didn't request this, please ignore this email.

© ${new Date().getFullYear()} Bit Habits. All rights reserved.
  `

  try {
    await transporter.sendMail({
      from: `"Bit Habits" <${SMTP_USER}>`,
      to: email,
      subject: "Password Reset - Bit Habits",
      text,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: "Failed to send email" }
  }
}

