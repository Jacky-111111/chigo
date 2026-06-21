# ChiGo Email Notifications

ChiGo uses Resend for transactional email. The app URL used in email links is:

```text
https://chi-go.vercel.app
```

Set this in Vercel as:

```text
NEXT_PUBLIC_APP_URL=https://chi-go.vercel.app
```

## What Sends Email

App-level email notifications are low-frequency social events only:

| Event | Recipient | Trigger |
| --- | --- | --- |
| Friend request | The user receiving the request | A user sends a friend request from `/friends`. |
| Invite joined | The invite host | Another user joins the host's dining invite. |
| Meal plan invitation | Each invited friend | A user creates a meal plan with selected friends. |

ChiGo does not currently send email for:

- Every chat message.
- Invite creation with no participant action.
- Open seat posts.
- Meal journal or nutrition updates.
- Menu analysis completion.

Those are intentionally excluded to avoid noisy email behavior.

## Required Environment Variables

```text
RESEND_API_KEY=
EMAIL_FROM=
EMAIL_REPLY_TO=
EMAIL_NOTIFICATIONS_ENABLED=true
EMAIL_TEST_RECIPIENT=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://chi-go.vercel.app
```

`RESEND_API_KEY` is the server-side Resend API key.

`EMAIL_FROM` must be a verified sender, for example:

```text
ChiGo <notifications@your-verified-domain.com>
```

Do not use `chi-go.vercel.app` as the sender domain unless Resend can verify DNS for that domain. The Vercel app URL is fine for links inside emails, but the sender domain should be a domain or subdomain you control.

`EMAIL_REPLY_TO` is optional. Use it only if replies should go to a monitored inbox.

`EMAIL_NOTIFICATIONS_ENABLED=false` disables app-level notification sending without removing the other email settings.

`EMAIL_TEST_RECIPIENT` is optional. When set, every app-level email is routed to that address instead of the real recipient. This is useful for staging and local testing.

`SUPABASE_SERVICE_ROLE_KEY` is required for app-level social notifications because recipient email addresses live in Supabase Auth, not in public profile rows. This key must only be used server-side. Never expose it as a `NEXT_PUBLIC_` variable.

## Resend Setup

1. Create or open the Resend project for ChiGo.
2. Add and verify a sending domain or subdomain in Resend.
3. Add the DNS records Resend provides, usually DKIM/SPF-related records.
4. Create a Resend API key with send permissions.
5. Add the API key to Vercel as `RESEND_API_KEY`.
6. Add `EMAIL_FROM` using a verified sender on that domain.
7. Deploy and send a low-risk test event.

ChiGo sends app-level notifications through the Resend HTTP API from server actions. This keeps the runtime dependency surface small while still using Resend as the email provider.

Each send uses a short timeout and an idempotency key derived from the product event, so retries should not create duplicate emails.

## Vercel Setup

In Vercel Project Settings, add the variables above for the Production environment.

Recommended production values:

```text
NEXT_PUBLIC_APP_URL=https://chi-go.vercel.app
EMAIL_NOTIFICATIONS_ENABLED=true
EMAIL_TEST_RECIPIENT=
```

For Preview deployments, either disable notifications:

```text
EMAIL_NOTIFICATIONS_ENABLED=false
```

or route all emails to a test inbox:

```text
EMAIL_TEST_RECIPIENT=your-test-inbox@example.com
```

## Supabase Auth Email

Supabase Auth emails, such as sign-up confirmation, magic links, password resets, and email changes, are configured separately from ChiGo app-level notifications.

For production, configure Supabase Auth to use Resend as custom SMTP instead of the default Supabase test email service.

In Supabase Dashboard:

1. Open Authentication settings.
2. Find SMTP / Custom SMTP settings.
3. Use the SMTP credentials provided by Resend.
4. Use a verified `From` address from your Resend domain.
5. Save and test sign-up or password reset email.

Keep Auth sender addresses separate from product notification sender addresses when possible. Example:

```text
auth@your-verified-domain.com
notifications@your-verified-domain.com
```

## Local Development

Local email sending is disabled unless all required email variables are set.

Recommended local `.env.local` while developing:

```text
EMAIL_NOTIFICATIONS_ENABLED=false
EMAIL_TEST_RECIPIENT=
```

If you need to test email locally:

```text
EMAIL_NOTIFICATIONS_ENABLED=true
EMAIL_TEST_RECIPIENT=your-test-inbox@example.com
```

Then perform a low-frequency event such as sending a friend request.

## Failure Behavior

Email sending is best-effort. If Resend is missing, disabled, times out, or fails, ChiGo still completes the user action and logs the email result on the server.

This protects key product actions such as joining an invite or creating a meal plan from being blocked by email provider failures.
