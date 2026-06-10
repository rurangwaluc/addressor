import twilio from "twilio";

type SendSmsOtpParams = {
  to: string;
  otp: string;
};

function normalizePhoneForSms(phone: string) {
  const trimmed = phone.trim();

  if (trimmed.startsWith("+")) {
    return trimmed;
  }

  return `+${trimmed}`;
}

function shouldUseRealSmsProvider() {
  return (
    process.env.NODE_ENV === "production" &&
    Boolean(process.env.TWILIO_ACCOUNT_SID) &&
    Boolean(process.env.TWILIO_AUTH_TOKEN) &&
    Boolean(process.env.TWILIO_FROM_NUMBER)
  );
}

export async function sendSmsOtp({ to, otp }: SendSmsOtpParams) {
  if (!shouldUseRealSmsProvider()) {
    console.log(`[DEV SMS OTP] to=${to} otp=${otp}`);

    return {
      provider: "dev-console",
      sent: true,
      messageSid: null,
      status: "dev",
    };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    throw new Error("Phone OTP delivery failed");
  }

  const client = twilio(accountSid, authToken);
  const normalizedTo = normalizePhoneForSms(to);

  try {
    const message = await client.messages.create({
      body: `Your Addressor verification code is ${otp}. It expires in 10 minutes.`,
      from,
      to: normalizedTo,
    });

    console.log("[TWILIO_SMS_OTP_SENT]", {
      to: normalizedTo,
      sid: message.sid,
      status: message.status,
    });

    return {
      provider: "twilio",
      sent: true,
      messageSid: message.sid,
      status: message.status,
    };
  } catch (error) {
    console.error("[TWILIO_SMS_OTP_FAILED]", {
      to: normalizedTo,
      error,
    });

    throw new Error("Phone OTP delivery failed");
  }
}