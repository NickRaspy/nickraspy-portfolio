import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const token = request.headers.get("authorization");
  if (!process.env.REVALIDATE_SECRET || token !== `Bearer ${process.env.REVALIDATE_SECRET}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  revalidateTag("portfolio-data", "max");
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}
