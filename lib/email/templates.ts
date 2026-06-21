import { getAppUrl } from "@/lib/email/config";

type NotificationEmailInput = {
  body: string;
  ctaLabel: string;
  ctaPath: string;
  headline: string;
  preview: string;
  secondaryBody?: string;
};

type RenderedEmail = {
  html: string;
  text: string;
};

const colors = {
  chili: "#E05C20",
  eggplant: "#372E7D",
  gold: "#ECB22D",
  indigo: "#6C6BE2",
  tangerine: "#DE7F24",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderNotificationEmail({
  body,
  ctaLabel,
  ctaPath,
  headline,
  preview,
  secondaryBody,
}: NotificationEmailInput): RenderedEmail {
  const ctaUrl = getAppUrl(ctaPath);
  const safeBody = escapeHtml(body);
  const safeCtaLabel = escapeHtml(ctaLabel);
  const safeHeadline = escapeHtml(headline);
  const safePreview = escapeHtml(preview);
  const safeSecondaryBody = secondaryBody ? escapeHtml(secondaryBody) : null;

  return {
    html: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safePreview}</title>
  </head>
  <body style="margin:0;background:#f7f6f2;font-family:Arial,Helvetica,sans-serif;color:#201f2e;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreview}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f6f2;padding:28px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e1d9;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:24px 26px;background:${colors.eggplant};">
                <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${colors.gold};">ChiGo</div>
                <h1 style="margin:10px 0 0;font-size:26px;line-height:1.2;color:#ffffff;">${safeHeadline}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:26px;">
                <p style="margin:0;font-size:16px;line-height:1.65;color:#353348;">${safeBody}</p>
                ${
                  safeSecondaryBody
                    ? `<p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#5f5b72;">${safeSecondaryBody}</p>`
                    : ""
                }
                <div style="margin:28px 0 4px;">
                  <a href="${ctaUrl}" style="display:inline-block;background:${colors.tangerine};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:12px 18px;border-radius:8px;">${safeCtaLabel}</a>
                </div>
                <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#817d91;">
                  If the button does not work, open this link: <a href="${ctaUrl}" style="color:${colors.indigo};">${ctaUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 26px;border-top:1px solid #eeeae2;background:#fffaf1;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#817d91;">You are receiving this because you use ChiGo social dining features.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: `${headline}

${body}
${secondaryBody ? `\n${secondaryBody}\n` : ""}
${ctaLabel}: ${ctaUrl}

You are receiving this because you use ChiGo social dining features.`,
  };
}
