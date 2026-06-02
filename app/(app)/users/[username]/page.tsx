import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import { sendFriendRequest } from "@/lib/actions/friend-actions";
import {
  getFriendshipBetweenUsers,
  getProfileByUsername,
} from "@/lib/services/friends";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type UserProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const [{ username }, user] = await Promise.all([params, requireUser()]);
  await requireCompletedProfile(user.id);
  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const friendship =
    profile.id === user.id
      ? null
      : await getFriendshipBetweenUsers(user.id, profile.id);

  return (
    <section className="page-shell grid gap-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-2">
          <Link href="/friends">
            <ArrowLeft size={17} />
            Back to friends
          </Link>
        </Button>
        <Card className="grid gap-5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid size-16 place-items-center rounded-full bg-[var(--brand-eggplant)] text-2xl font-black text-white">
                {profile.display_name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <h1 className="text-3xl font-black text-[var(--brand-eggplant)]">
                  {profile.display_name}
                </h1>
                <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">
                  @{profile.username}
                </p>
              </div>
            </div>

            {profile.id === user.id ? (
              <Badge variant="indigo">You</Badge>
            ) : friendship ? (
              <Badge variant="indigo">
                {formatFriendshipStatus(friendship.status)}
              </Badge>
            ) : (
              <form action={sendFriendRequest}>
                <input type="hidden" name="username" value={profile.username} />
                <Button type="submit">
                  <UserPlus size={16} />
                  Add friend
                </Button>
              </form>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[8px] bg-[#f7f7fb] p-4">
              <p className="text-xs font-bold uppercase text-[var(--text-muted)]">
                University
              </p>
              <p className="mt-1 font-black text-[var(--brand-eggplant)]">
                {profile.university}
              </p>
            </div>
            <div className="rounded-[8px] bg-[#f7f7fb] p-4">
              <p className="text-xs font-bold uppercase text-[var(--text-muted)]">
                Instagram
              </p>
              <p className="mt-1 font-black text-[var(--brand-eggplant)]">
                {profile.instagram_handle
                  ? `@${profile.instagram_handle}`
                  : "Not shared"}
              </p>
            </div>
          </div>

          {profile.bio ? (
            <div className="rounded-[8px] border border-[var(--border)] bg-white p-4">
              <p className="text-xs font-bold uppercase text-[var(--text-muted)]">
                Bio
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-main)]">
                {profile.bio}
              </p>
            </div>
          ) : null}
        </Card>
      </div>
    </section>
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
