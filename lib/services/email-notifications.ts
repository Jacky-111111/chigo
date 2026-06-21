import { renderNotificationEmail } from "@/lib/email/templates";
import { getEmailTestRecipient } from "@/lib/email/config";
import { sendAppEmail, type EmailDeliveryResult } from "@/lib/email/send";
import {
  createAdminClient,
  hasSupabaseAdminEnv,
} from "@/lib/supabase/admin";
import { getProfilesByIds } from "@/lib/services/friends";
import type { Profile } from "@/types/database";

type NotificationResult = {
  event: string;
  recipientUserId: string;
  result: EmailDeliveryResult;
};

type SendNotificationInput = {
  body: string;
  ctaLabel: string;
  ctaPath: string;
  event: string;
  headline: string;
  idempotencyKey: string;
  preview: string;
  recipientUserId: string;
  secondaryBody?: string;
  subject: string;
};

async function getUserEmail(userId: string) {
  const testRecipient = getEmailTestRecipient();

  if (testRecipient) {
    return testRecipient;
  }

  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error) {
    console.warn("Could not load email recipient.", {
      error: error.message,
      userId,
    });
    return null;
  }

  return data.user?.email ?? null;
}

async function sendNotificationEmail({
  body,
  ctaLabel,
  ctaPath,
  event,
  headline,
  idempotencyKey,
  preview,
  recipientUserId,
  secondaryBody,
  subject,
}: SendNotificationInput): Promise<NotificationResult> {
  const to = await getUserEmail(recipientUserId);

  if (!to) {
    return {
      event,
      recipientUserId,
      result: {
        status: "skipped",
        reason:
          "Recipient email is unavailable. Configure SUPABASE_SERVICE_ROLE_KEY or EMAIL_TEST_RECIPIENT.",
      },
    };
  }

  const email = renderNotificationEmail({
    body,
    ctaLabel,
    ctaPath,
    headline,
    preview,
    secondaryBody,
  });

  const result = await sendAppEmail({
    html: email.html,
    idempotencyKey,
    subject,
    tags: [{ name: "event", value: event }],
    text: email.text,
    to,
  });

  if (result.status === "failed") {
    console.warn("Email notification failed.", {
      error: result.error,
      event,
      recipientUserId,
    });
  }

  return {
    event,
    recipientUserId,
    result,
  };
}

export async function sendFriendRequestEmail({
  recipientName,
  recipientUserId,
  requesterName,
  requesterUserId,
  requesterUsername,
}: {
  recipientName: string;
  recipientUserId: string;
  requesterName: string;
  requesterUserId: string;
  requesterUsername: string;
}) {
  return sendNotificationEmail({
    body: `${requesterName} (@${requesterUsername}) sent you a friend request on ChiGo.`,
    ctaLabel: "Review request",
    ctaPath: "/friends",
    event: "friend_request",
    headline: "New friend request",
    idempotencyKey: `friend_request:${requesterUserId}:${recipientUserId}`,
    preview: `${requesterName} wants to connect on ChiGo.`,
    recipientUserId,
    secondaryBody: `Hi ${recipientName}, open ChiGo to accept or decline the request.`,
    subject: "New friend request on ChiGo",
  });
}

export async function sendInviteJoinedEmail({
  hostUserId,
  joinerName,
  joinerUserId,
  restaurantName,
  inviteId,
}: {
  hostUserId: string;
  inviteId: string;
  joinerName: string;
  joinerUserId: string;
  restaurantName: string;
}) {
  return sendNotificationEmail({
    body: `${joinerName} joined your ChiGo invite for ${restaurantName}.`,
    ctaLabel: "Open invite",
    ctaPath: `/invites/${inviteId}`,
    event: "invite_joined",
    headline: "Someone joined your invite",
    idempotencyKey: `invite_joined:${inviteId}:${joinerUserId}`,
    preview: `${joinerName} joined your ChiGo dining invite.`,
    recipientUserId: hostUserId,
    secondaryBody: "Use the invite chat to coordinate where to meet.",
    subject: `${joinerName} joined your ChiGo invite`,
  });
}

export async function sendMealPlanInvitationEmails({
  creatorName,
  planId,
  planTitle,
  recipientUserIds,
}: {
  creatorName: string;
  planId: string;
  planTitle: string;
  recipientUserIds: string[];
}) {
  if (recipientUserIds.length === 0) {
    return [] satisfies NotificationResult[];
  }

  let profiles = new Map<string, Profile>();

  try {
    profiles = await getProfilesByIds(recipientUserIds);
  } catch (error) {
    console.warn("Could not load meal plan email recipient profiles.", {
      error: error instanceof Error ? error.message : "Unknown profile error.",
      recipientUserIds,
    });
  }

  return Promise.all(
    recipientUserIds.map((recipientUserId) => {
      const recipientName =
        profiles.get(recipientUserId)?.display_name ?? "there";

      return sendNotificationEmail({
        body: `${creatorName} invited you to help plan "${planTitle}" on ChiGo.`,
        ctaLabel: "Open meal plan",
        ctaPath: `/plans/${planId}`,
        event: "meal_plan_invitation",
        headline: "Meal plan invitation",
        idempotencyKey: `meal_plan_invitation:${planId}:${recipientUserId}`,
        preview: `${creatorName} invited you to a ChiGo meal plan.`,
        recipientUserId,
        secondaryBody: `Hi ${recipientName}, share your availability and vote on restaurant options when you have a minute.`,
        subject: `${creatorName} invited you to a ChiGo meal plan`,
      });
    }),
  );
}
