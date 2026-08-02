import { headers } from "next/headers";
import { resolveSiteUrl } from "./site";

export async function getRequestSiteUrl(): Promise<URL> {
  return resolveSiteUrl(undefined, await headers());
}
