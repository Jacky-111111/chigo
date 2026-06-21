import { getEmailConfig } from "@/lib/email/config";

type EmailTag = {
  name: string;
  value: string;
};

type SendAppEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  idempotencyKey?: string;
  text: string;
  tags?: EmailTag[];
};

export type EmailDeliveryResult =
  | {
      status: "sent";
      id: string | null;
    }
  | {
      status: "skipped";
      reason: string;
    }
  | {
      status: "failed";
      error: string;
    };

type ResendEmailResponse = {
  id?: string;
  message?: string;
  name?: string;
};

const emailRequestTimeoutMs = 8000;

export async function sendAppEmail(
  input: SendAppEmailInput,
): Promise<EmailDeliveryResult> {
  const config = getEmailConfig();

  if (!config.enabled || !config.resendApiKey || !config.from) {
    return {
      status: "skipped",
      reason:
        "Email is not configured. Set RESEND_API_KEY, EMAIL_FROM, and keep EMAIL_NOTIFICATIONS_ENABLED enabled.",
    };
  }

  const to = config.testRecipient || input.to;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), emailRequestTimeoutMs);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify({
        from: config.from,
        html: input.html,
        reply_to: config.replyTo,
        subject: input.subject,
        tags: input.tags,
        text: input.text,
        to,
      }),
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json",
        ...(input.idempotencyKey
          ? { "Idempotency-Key": input.idempotencyKey }
          : {}),
      },
      method: "POST",
      signal: controller.signal,
    });
    let payload: ResendEmailResponse = {};

    try {
      payload = (await response.json()) as ResendEmailResponse;
    } catch {
      payload = {};
    }

    if (!response.ok) {
      return {
        status: "failed",
        error:
          payload.message ??
          payload.name ??
          `Resend returned HTTP ${response.status}.`,
      };
    }

    return {
      status: "sent",
      id: payload.id ?? null,
    };
  } catch (error) {
    return {
      status: "failed",
      error:
        error instanceof Error && error.name === "AbortError"
          ? "Resend request timed out."
          : error instanceof Error
            ? error.message
            : "Unknown email error.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
