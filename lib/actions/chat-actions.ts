"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { areAcceptedFriends } from "@/lib/services/friends";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";
import {
  chatMemberSchema,
  chatMessageFormSchema,
  deleteChatMessageSchema,
  friendGroupChatFormSchema,
  leaveChatSchema,
  renameFriendGroupChatSchema,
} from "@/lib/validations/social";
import type { ChatThread, ChatThreadMember } from "@/types/database";

type ChatActionResult = {
  ok: boolean;
  error?: string;
};

function chatError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createFriendGroupChat(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = friendGroupChatFormSchema.safeParse({
    title: formData.get("title"),
    memberIds: formData.getAll("memberIds"),
  });

  if (!parsed.success) {
    chatError(
      "/chats/new",
      parsed.error.issues[0]?.message ?? "Invalid group chat.",
    );
  }

  const memberIds = [...new Set(parsed.data.memberIds)].filter(
    (memberId) => memberId !== user.id,
  );

  if (memberIds.length === 0) {
    chatError("/chats/new", "Choose at least one friend.");
  }

  await assertAcceptedFriends(user.id, memberIds, "/chats/new");

  const supabase = await createClient();
  const { data: threadData, error: threadError } = await supabase
    .from("chat_threads")
    .insert({
      thread_type: "friend_group",
      title: parsed.data.title || null,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (threadError || !threadData) {
    chatError(
      "/chats/new",
      threadError?.message ?? "Could not create group chat.",
    );
  }

  const thread = threadData as ChatThread;
  const { error: ownerError } = await supabase
    .from("chat_thread_members")
    .insert({
      thread_id: thread.id,
      user_id: user.id,
      role: "owner",
      status: "active",
    });

  if (ownerError) {
    chatError("/chats/new", ownerError.message);
  }

  const { error: memberError } = await supabase
    .from("chat_thread_members")
    .insert(
      memberIds.map((memberId) => ({
        thread_id: thread.id,
        user_id: memberId,
        role: "member" as const,
        status: "active" as const,
      })),
    );

  if (memberError) {
    chatError("/chats/new", memberError.message);
  }

  revalidatePath("/chats");
  redirect(`/chats/${thread.id}`);
}

export async function renameFriendGroupChat(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = renameFriendGroupChatSchema.safeParse({
    threadId: formData.get("threadId"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    chatError(
      "/chats",
      parsed.error.issues[0]?.message ?? "Invalid group name.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("chat_threads")
    .update({ title: parsed.data.title || null })
    .eq("id", parsed.data.threadId)
    .eq("thread_type", "friend_group");

  if (error) {
    chatError(`/chats/${parsed.data.threadId}`, error.message);
  }

  revalidatePath("/chats");
  revalidatePath(`/chats/${parsed.data.threadId}`);
  redirect(
    `/chats/${parsed.data.threadId}?message=${encodeURIComponent("Group updated.")}`,
  );
}

export async function addFriendGroupChatMember(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = chatMemberSchema.safeParse({
    threadId: formData.get("threadId"),
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    chatError("/chats", parsed.error.issues[0]?.message ?? "Invalid member.");
  }

  await assertAcceptedFriends(
    user.id,
    [parsed.data.userId],
    `/chats/${parsed.data.threadId}`,
  );

  const supabase = await createClient();
  const { error } = await supabase.from("chat_thread_members").upsert(
    {
      thread_id: parsed.data.threadId,
      user_id: parsed.data.userId,
      role: "member",
      status: "active",
    },
    { onConflict: "thread_id,user_id" },
  );

  if (error) {
    chatError(`/chats/${parsed.data.threadId}`, error.message);
  }

  revalidatePath("/chats");
  revalidatePath(`/chats/${parsed.data.threadId}`);
  redirect(
    `/chats/${parsed.data.threadId}?message=${encodeURIComponent("Member added.")}`,
  );
}

export async function removeFriendGroupChatMember(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = chatMemberSchema.safeParse({
    threadId: formData.get("threadId"),
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    chatError("/chats", parsed.error.issues[0]?.message ?? "Invalid member.");
  }

  if (parsed.data.userId === user.id) {
    chatError(`/chats/${parsed.data.threadId}`, "Use leave group instead.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("chat_thread_members")
    .update({ status: "removed" })
    .eq("thread_id", parsed.data.threadId)
    .eq("user_id", parsed.data.userId)
    .neq("role", "owner");

  if (error) {
    chatError(`/chats/${parsed.data.threadId}`, error.message);
  }

  revalidatePath("/chats");
  revalidatePath(`/chats/${parsed.data.threadId}`);
  redirect(
    `/chats/${parsed.data.threadId}?message=${encodeURIComponent("Member removed.")}`,
  );
}

export async function leaveFriendGroupChat(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = leaveChatSchema.safeParse({
    threadId: formData.get("threadId"),
  });

  if (!parsed.success) {
    chatError("/chats", parsed.error.issues[0]?.message ?? "Invalid group.");
  }

  const supabase = await createClient();
  const { data: membersData, error: membersError } = await supabase
    .from("chat_thread_members")
    .select("*")
    .eq("thread_id", parsed.data.threadId)
    .eq("status", "active");

  if (membersError) {
    chatError(`/chats/${parsed.data.threadId}`, membersError.message);
  }

  const members = (membersData ?? []) as ChatThreadMember[];
  const currentMember = members.find((member) => member.user_id === user.id);

  if (!currentMember) {
    chatError("/chats", "Group not found.");
  }

  if (currentMember.role === "owner") {
    const nextOwner = members.find((member) => member.user_id !== user.id);

    if (nextOwner) {
      const { error: transferError } = await supabase
        .from("chat_thread_members")
        .update({ role: "owner" })
        .eq("thread_id", parsed.data.threadId)
        .eq("user_id", nextOwner.user_id);

      if (transferError) {
        chatError(`/chats/${parsed.data.threadId}`, transferError.message);
      }
    }
  }

  const { error } = await supabase
    .from("chat_thread_members")
    .update({ status: "left" })
    .eq("thread_id", parsed.data.threadId)
    .eq("user_id", user.id);

  if (error) {
    chatError(`/chats/${parsed.data.threadId}`, error.message);
  }

  revalidatePath("/chats");
  redirect(`/chats?message=${encodeURIComponent("Left group chat.")}`);
}

export async function sendChatMessage(
  formData: FormData,
): Promise<ChatActionResult> {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = chatMessageFormSchema.safeParse({
    threadId: formData.get("threadId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid message.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("chat_messages").insert({
    thread_id: parsed.data.threadId,
    sender_id: user.id,
    body: parsed.data.body,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/chats");
  revalidatePath(`/chats/${parsed.data.threadId}`);
  return { ok: true };
}

export async function deleteOwnChatMessage(
  formData: FormData,
): Promise<ChatActionResult> {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = deleteChatMessageSchema.safeParse({
    messageId: formData.get("messageId"),
    threadId: formData.get("threadId"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid message.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("chat_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.messageId)
    .eq("sender_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/chats/${parsed.data.threadId}`);
  return { ok: true };
}

async function assertAcceptedFriends(
  userId: string,
  memberIds: string[],
  errorPath: string,
) {
  for (const memberId of memberIds) {
    const accepted = await areAcceptedFriends(userId, memberId);

    if (!accepted) {
      chatError(errorPath, "You can only add accepted friends.");
    }
  }
}
