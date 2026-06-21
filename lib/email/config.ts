const defaultAppUrl = "https://chi-go.vercel.app";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getAppBaseUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL || defaultAppUrl;

  try {
    return trimTrailingSlash(new URL(rawUrl).toString());
  } catch {
    return defaultAppUrl;
  }
}

export function getAppUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${getAppBaseUrl()}${normalizedPath}`;
}

export function getEmailConfig() {
  const notificationsEnabled =
    process.env.EMAIL_NOTIFICATIONS_ENABLED !== "false";
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const replyTo = process.env.EMAIL_REPLY_TO;
  const testRecipient = process.env.EMAIL_TEST_RECIPIENT;

  return {
    enabled: notificationsEnabled && Boolean(resendApiKey && from),
    from,
    replyTo,
    resendApiKey,
    testRecipient,
  };
}

export function getEmailTestRecipient() {
  return process.env.EMAIL_TEST_RECIPIENT || null;
}
