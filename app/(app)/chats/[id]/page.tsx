import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, UserMinus } from "lucide-react";
import {
  addFriendGroupChatMember,
  leaveFriendGroupChat,
  removeFriendGroupChatMember,
  renameFriendGroupChat,
} from "@/lib/actions/chat-actions";
import { ChatPanel } from "@/components/chats/chat-panel";
import { getChatThreadDetail } from "@/lib/services/chats";
import { getAcceptedFriends } from "@/lib/services/friends";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export const dynamic = "force-dynamic";

type ChatDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ChatDetailPage({
  params,
  searchParams,
}: ChatDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const thread = await getChatThreadDetail(id);

  if (!thread) {
    notFound();
  }

  const currentMember = thread.members.find(
    (member) => member.user_id === user.id,
  );
  const isOwner = currentMember?.role === "owner";
  const acceptedFriends =
    thread.thread_type === "friend_group"
      ? await getAcceptedFriends(user.id)
      : [];
  const activeMemberIds = new Set(
    thread.members.map((member) => member.user_id),
  );
  const addableFriends = acceptedFriends.filter(
    (friend) => !activeMemberIds.has(friend.id),
  );

  return (
    <section className="page-shell grid gap-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-2">
          <Link href="/chats">
            <ArrowLeft size={17} />
            Back to chats
          </Link>
        </Button>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge
                variant={
                  thread.thread_type === "friend_group" ? "warm" : "indigo"
                }
              >
                {formatThreadType(thread.thread_type)}
              </Badge>
              {isOwner ? <Badge variant="indigo">Owner</Badge> : null}
            </div>
            <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
              {thread.displayTitle || "Group chat"}
            </h1>
          </div>
          {thread.thread_type !== "friend_group" ? (
            <Button asChild variant="secondary">
              <Link href={getParentHref(thread)}>Open meal context</Link>
            </Button>
          ) : null}
        </div>
      </div>

      {query?.error ? <Alert tone="error" message={query.error} /> : null}
      {query?.message ? <Alert tone="success" message={query.message} /> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <ChatPanel
          threadId={thread.id}
          currentUserId={user.id}
          initialMessages={thread.messages}
          title={thread.displayTitle || "Group chat"}
          emptyHint={
            thread.thread_type === "friend_group"
              ? "Start with where everyone wants to eat next."
              : "Ask a practical coordination question about this meal."
          }
        />

        <div className="grid h-fit gap-4">
          <Card className="grid gap-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
                Members
              </h2>
              <Badge variant="neutral">{thread.members.length}</Badge>
            </div>
            <div className="grid gap-3">
              {thread.members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--border)] bg-white p-3"
                >
                  <Link
                    href={`/users/${member.profile.username}`}
                    className="flex min-w-0 items-center gap-3"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--brand-eggplant)] text-xs font-black text-white">
                      {member.profile.display_name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-[var(--brand-eggplant)]">
                        {member.profile.display_name}
                      </span>
                      <span className="block truncate text-xs font-semibold text-[var(--text-muted)]">
                        @{member.profile.username}
                      </span>
                    </span>
                  </Link>
                  <div className="flex items-center gap-2">
                    {member.role === "owner" ? (
                      <Badge variant="indigo">Owner</Badge>
                    ) : null}
                    {isOwner &&
                    thread.thread_type === "friend_group" &&
                    member.user_id !== user.id &&
                    member.role !== "owner" ? (
                      <form action={removeFriendGroupChatMember}>
                        <input
                          type="hidden"
                          name="threadId"
                          value={thread.id}
                        />
                        <input
                          type="hidden"
                          name="userId"
                          value={member.user_id}
                        />
                        <button
                          type="submit"
                          className="grid size-8 place-items-center rounded-[8px] text-[var(--text-muted)] hover:bg-[rgba(224,92,32,0.08)] hover:text-[var(--food-chili)]"
                          title="Remove member"
                        >
                          <UserMinus size={15} />
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {thread.thread_type === "friend_group" ? (
            <Card className="grid gap-4 p-5">
              <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
                Group settings
              </h2>

              {isOwner ? (
                <form action={renameFriendGroupChat} className="grid gap-3">
                  <input type="hidden" name="threadId" value={thread.id} />
                  <Field label="Group name">
                    <Input
                      name="title"
                      defaultValue={thread.title ?? ""}
                      maxLength={80}
                    />
                  </Field>
                  <Button type="submit" variant="secondary">
                    Save name
                  </Button>
                </form>
              ) : null}

              {isOwner && addableFriends.length > 0 ? (
                <form action={addFriendGroupChatMember} className="grid gap-3">
                  <input type="hidden" name="threadId" value={thread.id} />
                  <Field label="Add friend">
                    <Select name="userId">
                      {addableFriends.map((friend) => (
                        <option key={friend.id} value={friend.id}>
                          {friend.display_name} (@{friend.username})
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Button type="submit" variant="secondary">
                    <Plus size={16} />
                    Add member
                  </Button>
                </form>
              ) : null}

              <form action={leaveFriendGroupChat}>
                <input type="hidden" name="threadId" value={thread.id} />
                <Button type="submit" variant="danger" className="w-full">
                  Leave group
                </Button>
              </form>
            </Card>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Alert({
  tone,
  message,
}: {
  tone: "error" | "success";
  message: string;
}) {
  return (
    <div
      className={
        tone === "error"
          ? "rounded-[8px] border border-[rgba(224,92,32,0.24)] bg-[rgba(224,92,32,0.08)] p-3 text-sm font-semibold text-[var(--food-chili)]"
          : "rounded-[8px] border border-[rgba(108,107,226,0.22)] bg-[rgba(108,107,226,0.1)] p-3 text-sm font-semibold text-[var(--brand-eggplant)]"
      }
    >
      {message}
    </div>
  );
}

function formatThreadType(threadType: string) {
  if (threadType === "dining_invite") {
    return "Invite chat";
  }

  if (threadType === "meal_plan") {
    return "Plan chat";
  }

  return "Friend group";
}

function getParentHref(thread: {
  dining_invite_id: string | null;
  meal_plan_id: string | null;
}) {
  if (thread.dining_invite_id) {
    return `/invites/${thread.dining_invite_id}`;
  }

  if (thread.meal_plan_id) {
    return `/plans/${thread.meal_plan_id}`;
  }

  return "/chats";
}
