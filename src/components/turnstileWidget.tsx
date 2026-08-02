"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

const DEVELOPMENT_SITE_KEY = "1x00000000000000000000AA";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      appearance: "interaction-only";
      size: "flexible";
      theme: "dark";
      callback: (token: string) => void;
      "error-callback": () => void;
      "expired-callback": () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export default function TurnstileWidget({
  onToken,
  resetSignal,
}: {
  onToken: (token: string) => void;
  resetSignal: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
    (process.env.NODE_ENV === "development" ? DEVELOPMENT_SITE_KEY : "");

  useEffect(() => {
    if (!scriptReady || !siteKey || !containerRef.current || !window.turnstile || widgetRef.current) return;

    widgetRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action: "contact",
      appearance: "interaction-only",
      size: "flexible",
      theme: "dark",
      callback: (token) => {
        setFailed(false);
        onToken(token);
      },
      "error-callback": () => {
        setFailed(true);
        onToken("");
      },
      "expired-callback": () => onToken(""),
    });

    return () => {
      if (widgetRef.current && window.turnstile) window.turnstile.remove(widgetRef.current);
      widgetRef.current = null;
    };
  }, [onToken, scriptReady, siteKey]);

  useEffect(() => {
    if (!resetSignal || !widgetRef.current || !window.turnstile) return;
    onToken("");
    window.turnstile.reset(widgetRef.current);
  }, [onToken, resetSignal]);

  if (!siteKey) {
    return <p className="form-feedback error" role="alert">PROTECTION_OFFLINE</p>;
  }

  return (
    <div className="turnstile-zone">
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setFailed(true)}
      />
      <div ref={containerRef} />
      {failed && <p className="form-feedback error" role="alert">VERIFICATION_FAILED // Retry.</p>}
    </div>
  );
}
