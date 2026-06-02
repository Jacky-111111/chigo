import Link from "next/link";
import { MessageCircle, Plus } from "lucide-react";
import { listChatThreads } from "@/lib/services/chats";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = {
  title: "Chats",
};

export const dynamic = "force-dynamic";

type ChatsPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ChatsPage({ searchParams }: ChatsPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const threads = await listChatThreads(user.id);
  const friendGroups = threads.filter(
    (thread) => thread.thread_type === "friend_group",
  );
  const temporaryThreads = threads.filter(
    (thread) => thread.thread_type !== "friend_group",
  );

  return (
    <section className="page-shell grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
            Group chats
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Keep the food talk going with friends, then use plan chats for
            specific meals.
          </p>
        </div>
        <Button asChild>
          <Link href="/chats/new">
            <Plus size={17} />
            New group
          </Link>
        </Button>
      </div>

      {params?.error ? <Alert tone="error" message={params.error} /> : null}
      {params?.message ? (
        <Alert tone="success" message={params.message} />
      ) : null}

      {friendGroups.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {friendGroups.map((thread) => (
            <ChatThreadCard key={thread.id} thread={thread} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No friend group chats yet"
          description="Create a group with accepted friends to start a persistent ChiGo chat."
          action={
            <Button asChild>
              <Link href="/chats/new">Create group chat</Link>
            </Button>
          }
        />
      )}

      {temporaryThreads.length > 0 ? (
        <Card className="grid gap-3 p-5">
          <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
            Meal coordination chats
          </h2>
          <div className="grid gap-3">
            {temporaryThreads.map((thread) => (
              <ChatThreadCard key={thread.id} thread={thread} compact />
            ))}
          </div>
        </Card>
      ) : null}
    </section>
  );
}

function ChatThreadCard({
  thread,
  compact = false,
}: {
  thread: Awaited<ReturnType<typeof listChatThreads>>[number];
  compact?: boolean;
}) {
  return (
    <Link
      href={`/chats/${thread.id}`}
      className="block rounded-[8px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-indigo)]"
    >
      <Card className={compact ? "p-4 shadow-none" : "p-5"}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MessageCircle
                className="text-[var(--food-tangerine)]"
                size={18}
              />
              <h2 className="truncate text-xl font-black text-[var(--brand-eggplant)]">
                {thread.displayTitle || "Group chat"}
              </h2>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-muted)]">
              {thread.latestMessage
                ? thread.latestMessage.deleted_at
                  ? "Latest message was deleted"
                  : `${thread.latestMessage.sender.display_name}: ${thread.latestMessage.body}`
                : "No messages yet"}
            </p>
          </div>
          <Badge
            variant={thread.thread_type === "friend_group" ? "warm" : "indigo"}
          >
            {formatThreadType(thread.thread_type)}
          </Badge>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex -space-x-2">
            {thread.members.slice(0, 5).map((member) => (
              <span
                key={member.user_id}
                className="grid size-8 place-items-center rounded-full border-2 border-white bg-[var(--brand-eggplant)] text-xs font-black text-white"
                title={member.profile.display_name}
              >
                {member.profile.display_name.slice(0, 1).toUpperCase()}
              </span>
            ))}
          </div>
          <span className="text-xs font-semibold text-[var(--text-muted)]">
            {thread.members.length} members
          </span>
        </div>
      </Card>
    </Link>
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
    return "Invite";
  }

  if (threadType === "meal_plan") {
    return "Plan";
  }

  return "Group";
}
