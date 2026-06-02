import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { createFriendGroupChat } from "@/lib/actions/chat-actions";
import { getAcceptedFriends } from "@/lib/services/friends";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export const metadata = {
  title: "New Group Chat",
};

export const dynamic = "force-dynamic";

type NewChatPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewChatPage({ searchParams }: NewChatPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const friends = await getAcceptedFriends(user.id);

  return (
    <section className="page-shell grid gap-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-2">
          <Link href="/chats">
            <ArrowLeft size={17} />
            Back to chats
          </Link>
        </Button>
        <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
          New group chat
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
          Create a persistent chat with accepted friends. This stays available
          between meal plans.
        </p>
      </div>

      {params?.error ? (
        <div className="rounded-[8px] border border-[rgba(224,92,32,0.24)] bg-[rgba(224,92,32,0.08)] p-3 text-sm font-semibold text-[var(--food-chili)]">
          {params.error}
        </div>
      ) : null}

      {friends.length > 0 ? (
        <form action={createFriendGroupChat} className="grid gap-5">
          <Card className="grid gap-5 p-5">
            <Field
              label="Group name"
              hint="Optional. ChiGo can fall back to member names."
            >
              <Input name="title" maxLength={80} placeholder="Dinner crew" />
            </Field>

            <div className="grid gap-3">
              <div>
                <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
                  Members
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Choose at least one friend.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {friends.map((friend) => (
                  <label
                    key={friend.id}
                    className="flex cursor-pointer items-center gap-3 rounded-[8px] border border-[var(--border)] bg-white p-3 text-sm font-semibold text-[var(--brand-eggplant)] transition hover:border-[var(--brand-indigo)] hover:bg-[#f4f3ff]"
                  >
                    <input
                      type="checkbox"
                      name="memberIds"
                      value={friend.id}
                      className="size-4 accent-[var(--food-tangerine)]"
                    />
                    <span className="grid size-9 place-items-center rounded-full bg-[var(--brand-eggplant)] text-xs font-black text-white">
                      {friend.display_name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate">
                        {friend.display_name}
                      </span>
                      <span className="block truncate text-xs text-[var(--text-muted)]">
                        @{friend.username}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit">
              <MessageCircle size={17} />
              Create chat
            </Button>
          </div>
        </form>
      ) : (
        <EmptyState
          title="Add friends first"
          description="Group chats can only include accepted friends."
          action={
            <Button asChild>
              <Link href="/friends">Find friends</Link>
            </Button>
          }
        />
      )}
    </section>
  );
}
