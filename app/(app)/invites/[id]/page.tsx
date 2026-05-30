import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Navigation, Users } from "lucide-react";
import { cancelDiningInvite, joinDiningInvite, leaveDiningInvite } from "@/lib/actions/invite-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getInviteDetail } from "@/lib/services/invites";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";
import { formatInviteTime, isExpired, isStartingSoon } from "@/lib/utils/time";

export const metadata = {
  title: "Invite",
};

export const dynamic = "force-dynamic";

type InviteDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function InviteDetailPage({ params, searchParams }: InviteDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const invite = await getInviteDetail(id);

  if (!invite) {
    notFound();
  }

  const joinedParticipants = invite.participants.filter((participant) => participant.status === "joined");
  const currentParticipant = joinedParticipants.find((participant) => participant.user_id === user.id);
  const isHost = invite.host_id === user.id;
  const isParticipant = Boolean(currentParticipant && !isHost);
  const openSpots = Math.max(invite.max_participants - joinedParticipants.length, 0);
  const joinDisabled = invite.status !== "open" || openSpots <= 0 || isExpired(invite.expires_at);
  const startingSoon = isStartingSoon(invite.start_at);

  return (
    <section className="page-shell grid gap-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-2">
          <Link href="/invites">
            <ArrowLeft size={17} />
            Back to invites
          </Link>
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant={invite.status === "open" ? "warm" : "urgent"}>{invite.status}</Badge>
              {startingSoon ? <Badge variant="urgent">Starting soon</Badge> : null}
              {isHost ? <Badge variant="indigo">You are hosting</Badge> : null}
              {isParticipant ? <Badge variant="indigo">You joined</Badge> : null}
            </div>
            <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
              {invite.restaurant.name}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              Hosted by {invite.host.display_name}. Meet at the restaurant and use Instagram if
              you already know each other.
            </p>
          </div>
        </div>
      </div>

      {query?.error ? (
        <div className="rounded-[8px] border border-[rgba(224,92,32,0.24)] bg-[rgba(224,92,32,0.08)] p-3 text-sm font-semibold text-[var(--food-chili)]">
          {query.error}
        </div>
      ) : null}

      {query?.message ? (
        <div className="rounded-[8px] border border-[rgba(108,107,226,0.22)] bg-[rgba(108,107,226,0.1)] p-3 text-sm font-semibold text-[var(--brand-eggplant)]">
          {query.message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="grid gap-5 p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[8px] bg-[#f7f7fb] p-4">
              <Clock className="mb-2 text-[var(--food-tangerine)]" size={20} />
              <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Start</p>
              <p className="mt-1 font-black text-[var(--brand-eggplant)]">
                {formatInviteTime(invite.start_at)}
              </p>
            </div>
            <div className="rounded-[8px] bg-[#f7f7fb] p-4">
              <Users className="mb-2 text-[var(--food-tangerine)]" size={20} />
              <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Seats</p>
              <p className="mt-1 font-black text-[var(--brand-eggplant)]">
                {joinedParticipants.length}/{invite.max_participants}
              </p>
            </div>
            <div className="rounded-[8px] bg-[#f7f7fb] p-4">
              <MapPin className="mb-2 text-[var(--food-tangerine)]" size={20} />
              <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Cuisine</p>
              <p className="mt-1 font-black text-[var(--brand-eggplant)]">
                {invite.restaurant.cuisine ?? "Restaurant"}
              </p>
            </div>
          </div>

          {invite.message ? (
            <div className="rounded-[8px] border border-[var(--border)] bg-white p-4">
              <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Host note</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-main)]">{invite.message}</p>
            </div>
          ) : null}

          <div className="rounded-[8px] border border-[var(--border)] bg-white p-4">
            <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Restaurant address</p>
            <p className="mt-2 text-sm font-semibold text-[var(--brand-eggplant)]">
              {invite.restaurant.address}
            </p>
            {invite.restaurant.google_maps_url ? (
              <Button asChild variant="secondary" className="mt-3">
                <a href={invite.restaurant.google_maps_url} target="_blank" rel="noreferrer">
                  <Navigation size={16} />
                  Directions
                </a>
              </Button>
            ) : null}
          </div>
        </Card>

        <Card className="h-fit p-5">
          <h2 className="text-xl font-black text-[var(--brand-eggplant)]">People</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {openSpots > 0 ? `${openSpots} seats still open.` : "This invite is full."}
          </p>

          <div className="mt-5 grid gap-3">
            {joinedParticipants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--border)] bg-white p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-[var(--brand-eggplant)] text-sm font-black text-white">
                    {participant.profile.display_name.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-black text-[var(--brand-eggplant)]">
                      {participant.profile.display_name}
                    </p>
                    <p className="text-xs font-semibold text-[var(--text-muted)]">
                      @{participant.profile.username}
                    </p>
                  </div>
                </div>
                <Badge variant={participant.role === "host" ? "indigo" : "neutral"}>
                  {participant.role}
                </Badge>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-2">
            {!isHost && !isParticipant ? (
              <form action={joinDiningInvite}>
                <input type="hidden" name="inviteId" value={invite.id} />
                <Button type="submit" className="w-full" disabled={joinDisabled}>
                  Join invite
                </Button>
              </form>
            ) : null}

            {isParticipant ? (
              <form action={leaveDiningInvite}>
                <input type="hidden" name="inviteId" value={invite.id} />
                <Button type="submit" variant="secondary" className="w-full">
                  Leave invite
                </Button>
              </form>
            ) : null}

            {isHost && invite.status === "open" ? (
              <form action={cancelDiningInvite}>
                <input type="hidden" name="inviteId" value={invite.id} />
                <Button type="submit" variant="danger" className="w-full">
                  Cancel invite
                </Button>
              </form>
            ) : null}
          </div>
        </Card>
      </div>
    </section>
  );
}
