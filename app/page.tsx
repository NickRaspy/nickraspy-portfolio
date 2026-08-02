import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { detectPreferredLocale, isSupportedLocale, localeCookieName } from "@/src/i18n/config";

export default async function Home() {
  const savedLocale = (await cookies()).get(localeCookieName)?.value;
  const locale = isSupportedLocale(savedLocale)
    ? savedLocale
    : detectPreferredLocale((await headers()).get("accept-language"));

  redirect(`/${locale}`);
}
