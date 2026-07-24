import { NextResponse } from "next/server";

import { deliverContact } from "@/src/contact/delivery";

const DEVELOPMENT_SECRET_KEY = "1x0000000000000000000000000000000AA";
const MAX_BODY_BYTES = 16_384;

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  website?: unknown;
  turnstileToken?: unknown;
};

type TurnstileResult = {
  success?: boolean;
  action?: string;
};

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizedName(value: unknown) {
  return text(value).replace(/\s+/g, " ");
}

function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function remoteAddress(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    ""
  );
}

async function validateTurnstile(token: string, request: Request) {
  const secret =
    process.env.TURNSTILE_SECRET_KEY ??
    (process.env.NODE_ENV === "development" ? DEVELOPMENT_SECRET_KEY : "");
  if (!secret) return { configured: false, valid: false };

  const formData = new FormData();
  formData.set("secret", secret);
  formData.set("response", token);
  formData.set("idempotency_key", crypto.randomUUID());
  const ip = remoteAddress(request);
  if (ip) formData.set("remoteip", ip);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return { configured: true, valid: false };

    const result = (await response.json()) as TurnstileResult;
    const validAction =
      result.action === "contact" ||
      (process.env.NODE_ENV === "development" && (!result.action || result.action === "test"));
    return { configured: true, valid: result.success === true && validAction };
  } catch {
    return { configured: true, valid: false };
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ ok: false, code: "FORBIDDEN" }, 403);

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) return json({ ok: false, code: "PAYLOAD_TOO_LARGE" }, 413);

  let payload: ContactPayload;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return json({ ok: false, code: "PAYLOAD_TOO_LARGE" }, 413);
    }
    payload = JSON.parse(rawBody) as ContactPayload;
  } catch {
    return json({ ok: false, code: "INVALID_REQUEST" }, 400);
  }

  const name = normalizedName(payload.name);
  const email = text(payload.email).toLowerCase();
  const message = text(payload.message);
  const website = text(payload.website);
  const turnstileToken = text(payload.turnstileToken);

  // Bots commonly fill hidden inputs. Return the normal success shape so the
  // field does not become a useful detection oracle.
  if (website) return json({ ok: true }, 200);

  if (
    name.length < 2 ||
    name.length > 80 ||
    !validEmail(email) ||
    message.length < 10 ||
    message.length > 4_000
  ) {
    return json({ ok: false, code: "INVALID_FIELDS" }, 400);
  }

  if (!turnstileToken || turnstileToken.length > 2_048) {
    return json({ ok: false, code: "VERIFICATION_REQUIRED" }, 400);
  }

  const verification = await validateTurnstile(turnstileToken, request);
  if (!verification.configured) return json({ ok: false, code: "SERVICE_NOT_CONFIGURED" }, 503);
  if (!verification.valid) return json({ ok: false, code: "VERIFICATION_FAILED" }, 400);

  const delivery = await deliverContact({ name, email, message });
  if (!delivery.configured) return json({ ok: false, code: "SERVICE_NOT_CONFIGURED" }, 503);
  if (!delivery.delivered) return json({ ok: false, code: "DELIVERY_FAILED" }, 502);

  return json({ ok: true }, 200);
}
