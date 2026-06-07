import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getProfilesByIds } from "@/lib/services/friends";
import type {
  ChatMessage,
  ChatThread,
  ChatThreadMember,
  DiningInviteParticipant,
  MealPlanParticipant,
  Profile,
} from "@/types/database";

export type ChatMessageWithSender = ChatMessage & {
  sender: Pick<Profile, "id" | "display_name" | "username">;
};

export type ChatMemberWithProfile = ChatThreadMember & {
  profile: Profile;
};

export type ChatThreadWithDetails = ChatThread & {
  members: ChatMemberWithProfile[];
  latestMessage: ChatMessageWithSender | null;
  displayTitle: string;
};

export type ChatThreadDetail = ChatThreadWithDetails & {
  messages: ChatMessageWithSender[];
};

export async function listChatThreads(
  currentUserId: string,
): Promise<ChatThreadWithDetails[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createClient();
  const { data: membershipData, error: membershipError } = await supabase
    .from("chat_thread_members")
    .select("*")
    .eq("user_id", currentUserId)
    .eq("status", "active");

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const memberships = (membershipData ?? []) as ChatThreadMember[];
  const threadIds = memberships.map((membership) => membership.thread_id);

  if (threadIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .in("id", threadIds)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return hydrateChatThreads((data ?? []) as ChatThread[]);
}

export async function getChatThreadDetail(
  threadId: string,
): Promise<ChatThreadDetail | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const [thread] = await hydrateChatThreads([data as ChatThread]);

  if (!thread) {
    return null;
  }

  return {
    ...thread,
    messages: await listChatMessages(thread.id),
  };
}

export async function getDiningInviteChatThreadDetail(inviteId: string) {
  const thread = await getDiningInviteChatThread(inviteId);

  if (!thread) {
    return null;
  }

  return getChatThreadDetail(thread.id);
}

export async function getMealPlanChatThreadDetail(planId: string) {
  const thread = await getMealPlanChatThread(planId);

  if (!thread) {
    return null;
  }

  return getChatThreadDetail(thread.id);
}

export async function listChatMessages(threadId: string) {
  if (!hasSupabaseEnv()) {
    return [] satisfies ChatMessageWithSender[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return hydrateChatMessages((data ?? []) as ChatMessage[]);
}

export async function ensureDiningInviteChatThread(inviteId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data: inviteData, error: inviteError } = await supabase
    .from("dining_invites")
    .select("*")
    .eq("id", inviteId)
    .maybeSingle();

  if (inviteError || !inviteData) {
    throw new Error(inviteError?.message ?? "Invite not found.");
  }

  const invite = inviteData as { id: string; host_id: string };
  const { data: existingData, error: existingError } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("dining_invite_id", invite.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  let thread = existingData as ChatThread | null;

  if (!thread) {
    const { data: createdData, error: createError } = await supabase
      .from("chat_threads")
      .insert({
        thread_type: "dining_invite",
        created_by: invite.host_id,
        dining_invite_id: invite.id,
      })
      .select("*")
      .single();

    if (createError || !createdData) {
      throw new Error(createError?.message ?? "Could not create invite chat.");
    }

    thread = createdData as ChatThread;
  }

  const { data: participantsData, error: participantsError } = await supabase
    .from("dining_invite_participants")
    .select("*")
    .eq("invite_id", invite.id)
    .eq("status", "joined");

  if (participantsError) {
    throw new Error(participantsError.message);
  }

  const participants = (participantsData ?? []) as DiningInviteParticipant[];
  await syncChatThreadMembers(
    thread.id,
    participants.map((participant) => ({
      userId: participant.user_id,
      role:
        participant.role === "host" ? ("owner" as const) : ("member" as const),
      status: "active" as const,
    })),
  );

  return thread;
}

export async function addCurrentUserToDiningInviteChatThread(
  inviteId: string,
  userId: string,
) {
  const thread = await getDiningInviteChatThread(inviteId);

  if (!thread) {
    return null;
  }

  await syncChatThreadMembers(thread.id, [
    { userId, role: "member", status: "active" },
  ]);

  return thread;
}

export async function leaveDiningInviteChatThread(
  inviteId: string,
  userId: string,
) {
  const thread = await getDiningInviteChatThread(inviteId);

  if (!thread) {
    return;
  }

  await updateChatMemberStatus(thread.id, userId, "left");
}

export async function ensureMealPlanChatThread(planId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data: planData, error: planError } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();

  if (planError || !planData) {
    throw new Error(planError?.message ?? "Plan not found.");
  }

  const plan = planData as { id: string; creator_id: string; title: string };
  const { data: existingData, error: existingError } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("meal_plan_id", plan.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  let thread = existingData as ChatThread | null;

  if (!thread) {
    const { data: createdData, error: createError } = await supabase
      .from("chat_threads")
      .insert({
        thread_type: "meal_plan",
        title: plan.title,
        created_by: plan.creator_id,
        meal_plan_id: plan.id,
      })
      .select("*")
      .single();

    if (createError || !createdData) {
      throw new Error(createError?.message ?? "Could not create plan chat.");
    }

    thread = createdData as ChatThread;
  }

  const { data: participantData, error: participantError } = await supabase
    .from("meal_plan_participants")
    .select("*")
    .eq("plan_id", plan.id)
    .in("status", ["invited", "joined"]);

  if (participantError) {
    throw new Error(participantError.message);
  }

  const participants = (participantData ?? []) as MealPlanParticipant[];
  await syncChatThreadMembers(
    thread.id,
    participants.map((participant) => ({
      userId: participant.user_id,
      role:
        participant.role === "creator"
          ? ("owner" as const)
          : ("member" as const),
      status: "active" as const,
    })),
  );

  return thread;
}

export async function leaveMealPlanChatThread(planId: string, userId: string) {
  const thread = await getMealPlanChatThread(planId);

  if (!thread) {
    return;
  }

  await updateChatMemberStatus(thread.id, userId, "left");
}

export async function addCurrentUserToMealPlanChatThread(
  planId: string,
  userId: string,
) {
  const thread = await getMealPlanChatThread(planId);

  if (!thread) {
    return null;
  }

  await syncChatThreadMembers(thread.id, [
    { userId, role: "member", status: "active" },
  ]);

  return thread;
}

async function getDiningInviteChatThread(inviteId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("dining_invite_id", inviteId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as ChatThread | null;
}

async function getMealPlanChatThread(planId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("meal_plan_id", planId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as ChatThread | null;
}

export async function syncChatThreadMembers(
  threadId: string,
  members: Array<{
    userId: string;
    role: ChatThreadMember["role"];
    status: ChatThreadMember["status"];
  }>,
) {
  if (members.length === 0) {
    return;
  }

  const supabase = await createClient();
  const membersByUser = new Map<
    string,
    {
      thread_id: string;
      user_id: string;
      role: ChatThreadMember["role"];
      status: ChatThreadMember["status"];
    }
  >();

  for (const member of members) {
    const existing = membersByUser.get(member.userId);

    if (!existing || member.role === "owner") {
      membersByUser.set(member.userId, {
        thread_id: threadId,
        user_id: member.userId,
        role: member.role,
        status: member.status,
      });
    }
  }

  const rows = [...membersByUser.values()].sort((a, b) => {
    if (a.role === b.role) {
      return 0;
    }

    return a.role === "owner" ? -1 : 1;
  });

  for (const row of rows) {
    const { count, error: updateError } = await supabase
      .from("chat_thread_members")
      .update(
        {
          role: row.role,
          status: row.status,
        },
        { count: "exact" },
      )
      .eq("thread_id", row.thread_id)
      .eq("user_id", row.user_id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (count && count > 0) {
      continue;
    }

    const { error: insertError } = await supabase
      .from("chat_thread_members")
      .insert(row);

    if (!insertError) {
      continue;
    }

    if (insertError.code !== "23505") {
      throw new Error(insertError.message);
    }

    const { error: retryUpdateError } = await supabase
      .from("chat_thread_members")
      .update({
        role: row.role,
        status: row.status,
      })
      .eq("thread_id", row.thread_id)
      .eq("user_id", row.user_id);

    if (retryUpdateError) {
      throw new Error(retryUpdateError.message);
    }
  }
}

async function updateChatMemberStatus(
  threadId: string,
  userId: string,
  status: ChatThreadMember["status"],
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("chat_thread_members")
    .update({ status })
    .eq("thread_id", threadId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

async function hydrateChatThreads(threads: ChatThread[]) {
  if (threads.length === 0) {
    return [] satisfies ChatThreadWithDetails[];
  }

  const supabase = await createClient();
  const threadIds = threads.map((thread) => thread.id);
  const [
    { data: membersData, error: membersError },
    { data: latestMessagesData, error: latestMessagesError },
  ] = await Promise.all([
    supabase
      .from("chat_thread_members")
      .select("*")
      .in("thread_id", threadIds)
      .eq("status", "active"),
    supabase
      .from("chat_messages")
      .select("*")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false }),
  ]);

  if (membersError) {
    throw new Error(membersError.message);
  }

  if (latestMessagesError) {
    throw new Error(latestMessagesError.message);
  }

  const members = (membersData ?? []) as ChatThreadMember[];
  const profileIds = [...new Set(members.map((member) => member.user_id))];
  const profiles = await getProfilesByIds(profileIds);
  const membersByThread = new Map<string, ChatMemberWithProfile[]>();

  for (const member of members) {
    const profile = profiles.get(member.user_id);

    if (!profile) {
      continue;
    }

    const list = membersByThread.get(member.thread_id) ?? [];
    list.push({ ...member, profile });
    membersByThread.set(member.thread_id, list);
  }

  const latestByThread = new Map<string, ChatMessage>();

  for (const message of (latestMessagesData ?? []) as ChatMessage[]) {
    if (!latestByThread.has(message.thread_id)) {
      latestByThread.set(message.thread_id, message);
    }
  }

  const latestMessages = await hydrateChatMessages([
    ...latestByThread.values(),
  ]);
  const hydratedLatestByThread = new Map(
    latestMessages.map((message) => [message.thread_id, message]),
  );

  return threads.map((thread) => {
    const threadMembers = (membersByThread.get(thread.id) ?? []).sort((a, b) =>
      a.profile.display_name.localeCompare(b.profile.display_name),
    );

    return {
      ...thread,
      members: threadMembers,
      latestMessage: hydratedLatestByThread.get(thread.id) ?? null,
      displayTitle: getThreadDisplayTitle(thread, threadMembers),
    };
  });
}

async function hydrateChatMessages(messages: ChatMessage[]) {
  if (messages.length === 0) {
    return [] satisfies ChatMessageWithSender[];
  }

  const profiles = await getProfilesByIds([
    ...new Set(messages.map((message) => message.sender_id)),
  ]);

  return messages.flatMap((message) => {
    const profile = profiles.get(message.sender_id);

    if (!profile) {
      return [];
    }

    return [
      {
        ...message,
        sender: {
          id: profile.id,
          display_name: profile.display_name,
          username: profile.username,
        },
      },
    ];
  });
}

function getThreadDisplayTitle(
  thread: ChatThread,
  members: ChatMemberWithProfile[],
) {
  if (thread.title?.trim()) {
    return thread.title;
  }

  if (thread.thread_type === "dining_invite") {
    return "Invite chat";
  }

  if (thread.thread_type === "meal_plan") {
    return "Meal plan chat";
  }

  return members
    .slice(0, 3)
    .map((member) => member.profile.display_name)
    .join(", ");
}
