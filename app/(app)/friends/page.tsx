import Link from "next/link";
import { Check, Search, UserPlus, X } from "lucide-react";
import {
  removeFriend,
  respondToFriendRequest,
  sendFriendRequest,
} from "@/lib/actions/friend-actions";
import {
  getFriendOverview,
  searchProfilesForFriendRequest,
} from "@/lib/services/friends";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

export const metadata = {
  title: "Friends",
};

export const dynamic = "force-dynamic";

type FriendsPageProps = {
  searchParams?: Promise<{
    q?: string;
    error?: string;
    message?: string;
  }>;
};

export default async function FriendsPage({ searchParams }: FriendsPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const query = params?.q?.trim() ?? "";
  const [overview, searchResults] = await Promise.all([
    getFriendOverview(user.id),
    query
      ? searchProfilesForFriendRequest(user.id, query)
      : Promise.resolve([]),
  ]);

  return (
    <section className="page-shell grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
            Friends
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Build your ChiGo circle before planning meals and group chats.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/chats/new">
            <UserPlus size={17} />
            New group
          </Link>
        </Button>
      </div>

      {params?.error ? <Alert tone="error" message={params.error} /> : null}
      {params?.message ? (
        <Alert tone="success" message={params.message} />
      ) : null}

      <Card className="grid gap-4 p-5">
        <div>
          <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
            Find classmates
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Search by username or display name.
          </p>
        </div>
        <form className="flex flex-col gap-3 sm:flex-row" action="/friends">
          <Input name="q" defaultValue={query} placeholder="Search username" />
          <Button type="submit" className="shrink-0">
            <Search size={16} />
            Search
          </Button>
        </form>

        {query ? (
          <div className="grid gap-3">
            {searchResults.length > 0 ? (
              searchResults.map((profile) => (
                <div
                  key={profile.id}
                  className="flex flex-col gap-3 rounded-[8px] border border-[var(--border)] bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <ProfileIdentity profile={profile} />
                  {profile.friendship ? (
                    <Badge variant="indigo">
                      {formatFriendshipStatus(profile.friendship.status)}
                    </Badge>
                  ) : (
                    <form action={sendFriendRequest}>
                      <input
                        type="hidden"
                        name="username"
                        value={profile.username}
                      />
                      <Button type="submit" variant="secondary">
                        <UserPlus size={16} />
                        Add
                      </Button>
                    </form>
                  )}
                </div>
              ))
            ) : (
              <p className="rounded-[8px] bg-[#f7f7fb] p-3 text-sm text-[var(--text-muted)]">
                No matching users.
              </p>
            )}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="grid gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
              Your friends
            </h2>
            <Badge variant="warm">{overview.acceptedFriends.length}</Badge>
          </div>

          {overview.acceptedFriends.length > 0 ? (
            <div className="grid gap-3">
              {overview.acceptedFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex flex-col gap-3 rounded-[8px] border border-[var(--border)] bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <ProfileIdentity profile={friend} />
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="ghost">
                      <Link href={`/users/${friend.username}`}>Profile</Link>
                    </Button>
                    <form action={removeFriend}>
                      <input type="hidden" name="friendId" value={friend.id} />
                      <Button type="submit" variant="secondary">
                        Remove
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No friends yet"
              description="Search for a username and send your first request."
            />
          )}
        </Card>

        <div className="grid gap-4">
          <Card className="grid gap-4 p-5">
            <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
              Requests
            </h2>
            {overview.incomingRequests.length > 0 ? (
              <div className="grid gap-3">
                {overview.incomingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="grid gap-3 rounded-[8px] border border-[var(--border)] bg-white p-3"
                  >
                    <ProfileIdentity profile={request.requester} />
                    <div className="flex gap-2">
                      <form action={respondToFriendRequest}>
                        <input
                          type="hidden"
                          name="friendshipId"
                          value={request.id}
                        />
                        <input type="hidden" name="response" value="accepted" />
                        <Button type="submit" className="min-h-9 px-3">
                          <Check size={15} />
                          Accept
                        </Button>
                      </form>
                      <form action={respondToFriendRequest}>
                        <input
                          type="hidden"
                          name="friendshipId"
                          value={request.id}
                        />
                        <input type="hidden" name="response" value="rejected" />
                        <Button
                          type="submit"
                          variant="secondary"
                          className="min-h-9 px-3"
                        >
                          <X size={15} />
                          Decline
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-[8px] bg-[#f7f7fb] p-3 text-sm text-[var(--text-muted)]">
                No incoming requests.
              </p>
            )}
          </Card>

          <Card className="grid gap-4 p-5">
            <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
              Sent
            </h2>
            {overview.outgoingRequests.length > 0 ? (
              <div className="grid gap-3">
                {overview.outgoingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-[8px] border border-[var(--border)] bg-white p-3"
                  >
                    <ProfileIdentity profile={request.addressee} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-[8px] bg-[#f7f7fb] p-3 text-sm text-[var(--text-muted)]">
                No pending sent requests.
              </p>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}

function ProfileIdentity({
  profile,
}: {
  profile: { display_name: string; username: string };
}) {
  return (
    <Link
      href={`/users/${profile.username}`}
      className="flex min-w-0 items-center gap-3 rounded-[8px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-indigo)]"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--brand-eggplant)] text-sm font-black text-white">
        {profile.display_name.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-[var(--brand-eggplant)]">
          {profile.display_name}
        </span>
        <span className="block truncate text-xs font-semibold text-[var(--text-muted)]">
          @{profile.username}
        </span>
      </span>
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

function formatFriendshipStatus(status: string) {
  if (status === "accepted") {
    return "Friends";
  }

  if (status === "pending") {
    return "Pending";
  }

  return status;
}
