import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

function validBearerToken(header: string | null, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const provided = Buffer.from(header ?? "");
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || !validBearerToken(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  revalidateTag("portfolio-data", "max");
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}
