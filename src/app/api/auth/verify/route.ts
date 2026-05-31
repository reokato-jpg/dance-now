import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";

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

function isDbAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function POST(req: NextRequest) {
  const { phone, code } = await req.json();

  if (!phone || !code) {
    return NextResponse.json({ error: "パラメータが不足しています" }, { status: 400 });
  }

  const e164 = `+81${phone.replace(/^0/, "")}`;

  // Dev bypass: accept "123456" when Twilio credentials are not configured
  if (isDevMode()) {
    if (code !== "123456") {
      return NextResponse.json({ error: "コードが正しくありません（開発モード: 123456）" }, { status: 401 });
    }
  } else {
    try {
      const client = getTwilioClient();
      const result = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
        .verificationChecks.create({ to: e164, code });

      if (result.status !== "approved") {
        return NextResponse.json({ error: "コードが正しくありません" }, { status: 401 });
      }
    } catch (err) {
      console.error("Verify error:", err);
      return NextResponse.json({ error: "認証に失敗しました" }, { status: 500 });
    }
  }

  // DB lookup / create
  if (!isDbAvailable()) {
    const mockCustomer = {
      id: `dev-${phone}`,
      phone,
      email: null,
      lastName: null,
      firstName: null,
      genres: [],
    };
    return NextResponse.json({ customer: mockCustomer, isNew: false });
  }

  try {
    const db = getAdminClient();
    const { data: existing } = await db.from("customers")
      .select("id, phone, email, last_name, first_name, genres")
      .eq("phone", phone)
      .maybeSingle();

    const isNew = !existing;
    let customer = existing as any;

    if (!customer) {
      const { data: created, error: createErr } = await db.from("customers")
        .insert({ id: crypto.randomUUID(), phone })
        .select("id, phone, email, last_name, first_name, genres")
        .single();
      if (createErr) throw createErr;
      customer = created as any;
    }

    return NextResponse.json({
      customer: {
        id: customer.id,
        phone: customer.phone,
        email: customer.email,
        lastName: customer.last_name,
        firstName: customer.first_name,
        genres: customer.genres ?? [],
      },
      isNew,
    });
  } catch (err) {
    console.error("DB error:", err);
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 500 });
  }
}
