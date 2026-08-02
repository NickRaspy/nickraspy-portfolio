import { useCallback, useState, type FormEvent } from "react";
import type { SupportedLocale } from "@/src/i18n/config";
import TurnstileWidget from "../turnstileWidget";
import { Glyph, Panel, type DragHandler, type Point } from "./panels";

type HudMessages = (typeof import("@/src/i18n/messages"))["messages"][SupportedLocale];

export function useContactForm(copy: HudMessages) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const receiveTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    if (!turnstileToken) {
      setFormError(copy.contact.verificationPending);
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    setSending(true);
    setFormError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
          website: formData.get("website"),
          turnstileToken,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        code?: string;
      } | null;

      if (!response.ok || !result?.ok) {
        const retryVerification =
          result?.code === "VERIFICATION_FAILED" || result?.code === "VERIFICATION_REQUIRED";
        setFormError(
          retryVerification
            ? copy.contact.verificationFailed
            : result?.code === "INVALID_FIELDS"
              ? copy.contact.invalidPayload
              : copy.contact.transferFailed,
        );
        return;
      }

      form.reset();
      setSent(true);
    } catch {
      setFormError(copy.contact.connectionLost);
    } finally {
      setSending(false);
      setTurnstileReset((value) => value + 1);
    }
  };

  return {
    sent,
    sending,
    formError,
    turnstileToken,
    turnstileReset,
    receiveTurnstileToken,
    submitContact,
    startNewTransmission: () => {
      setSent(false);
      setFormError("");
    },
  };
}

export default function Contact({
  copy,
  controller,
  onPointerDown,
  offset,
}: {
  copy: HudMessages;
  controller: ReturnType<typeof useContactForm>;
  onPointerDown: DragHandler;
  offset: Point;
}) {
  return (
    <Panel
      title={copy.panels.contact}
      id="004"
      onPointerDown={onPointerDown}
      offset={offset}
      className="contact-panel"
    >
      {controller.sent ? (
        <div className="success">
          <Glyph type="contact" />
          <b>{copy.contact.success}</b>
          <p>{copy.contact.successDescription}</p>
          <button onClick={controller.startNewTransmission}>
            {copy.contact.newTransmission}
          </button>
        </div>
      ) : (
        <form onSubmit={controller.submitContact}>
          <label>
            {copy.contact.name}
            <input
              name="name"
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              placeholder={copy.contact.namePlaceholder}
            />
          </label>
          <label>
            {copy.contact.email}
            <input
              name="email"
              required
              maxLength={254}
              type="email"
              autoComplete="email"
              placeholder={copy.contact.emailPlaceholder}
            />
          </label>
          <label>
            {copy.contact.message}
            <textarea
              name="message"
              required
              minLength={10}
              maxLength={4000}
              placeholder={copy.contact.messagePlaceholder}
            />
          </label>
          <label className="signal-trap" aria-hidden="true">
            {copy.contact.website}
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
          <TurnstileWidget
            onToken={controller.receiveTurnstileToken}
            resetSignal={controller.turnstileReset}
          />
          {controller.formError && (
            <p className="form-feedback error" role="alert">
              {controller.formError}
            </p>
          )}
          <button
            className="hud-action"
            disabled={controller.sending || !controller.turnstileToken}
          >
            {controller.sending ? copy.contact.submitting : copy.contact.submit}
          </button>
        </form>
      )}
    </Panel>
  );
}
