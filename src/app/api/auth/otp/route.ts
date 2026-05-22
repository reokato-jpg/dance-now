import { NextRequest, NextResponse } from "next/server";

function isDevMode() {
  return (
    !process.env.TWILIO_ACCOUNT_SID ||
    process.env.TWILIO_ACCOUNT_SID.startsWith("ACplaceholder") ||
    process.env.TWILIO_ACCOUNT_SID === ""
  );
}

function getTwilioClient() {
  const twilio = require("twilio");
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
}

export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  if (!phone || !/^0[0-9]{9,10}$/.test(phone)) {
    return NextResponse.json({ error: "電話番号が無効です" }, { status: 400 });
  }

  // Dev bypass: skip real Twilio when credentials are not configured
  if (isDevMode()) {
    console.log(`[DEV] OTP bypass for ${phone} — use code: 123456`);
    return NextResponse.json({ success: true, dev: true });
  }

  const e164 = `+81${phone.replace(/^0/, "")}`;

  try {
    const client = getTwilioClient();
    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({ to: e164, channel: "sms" });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Twilio OTP error:", err);
    return NextResponse.json({ error: "SMS送信に失敗しました" }, { status: 500 });
  }
}
