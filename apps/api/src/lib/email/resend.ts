import { Resend } from "resend";

type SendEmailOtpParams = {
  to: string;
  otp: string;
};

function shouldUseRealEmailProvider() {
  return process.env.NODE_ENV === "production" && Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmailOtp({ to, otp }: SendEmailOtpParams) {
  if (!shouldUseRealEmailProvider()) {
    console.log(`[DEV EMAIL OTP] to=${to} otp=${otp}`);

    return {
      provider: "dev-console",
      sent: true,
      messageId: null,
    };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Addressor <onboarding@resend.dev>",
    to,
    subject: "Your Addressor verification code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h1 style="margin: 0 0 12px;">Verify your Addressor account</h1>
        <p style="color: #555; line-height: 1.6;">
          Use this code to verify your email address. It expires in 10 minutes.
        </p>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 18px 20px; background: #f8f3ea; border-radius: 16px; text-align: center;">
          ${otp}
        </div>
        <p style="color: #777; font-size: 13px; margin-top: 18px;">
          If you did not request this, you can ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[RESEND_EMAIL_OTP_FAILED]", {
      to,
      error,
    });

    throw new Error("Email OTP delivery failed");
  }

  console.log("[RESEND_EMAIL_OTP_SENT]", {
    to,
    messageId: data?.id ?? null,
  });

  return {
    provider: "resend",
    sent: true,
    messageId: data?.id ?? null,
  };
}