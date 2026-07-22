import { getAdminSession } from "./admin";

function allowedRequestOrigins(request: Request): Set<string> {
  const requestUrl = new URL(request.url);
  const protocol = (request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || requestUrl.protocol).replace(/:$/, "");
  const hosts = [
    requestUrl.host,
    request.headers.get("host"),
    request.headers.get("x-forwarded-host")?.split(",")[0].trim(),
  ].filter((value): value is string => Boolean(value));
  return new Set(hosts.flatMap((host) => {
    try {
      return [new URL(`${protocol}://${host}`).origin];
    } catch {
      return [];
    }
  }));
}

export async function authorizeAdminMutation(request: Request) {
  const session = await getAdminSession();
  if (!session) return { error: Response.json({ error: "Unauthorized." }, { status: 401 }) };

  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!origin || !allowedRequestOrigins(request).has(origin) || (fetchSite && fetchSite !== "same-origin")) {
    return { error: Response.json({ error: "Invalid request origin." }, { status: 403 }) };
  }
  return { session };
}
