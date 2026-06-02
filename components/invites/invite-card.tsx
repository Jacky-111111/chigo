import Link from "next/link";
import { Clock, MapPin, Users } from "lucide-react";
import type { InviteWithDetails } from "@/lib/services/invites";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatInviteTime, isStartingSoon } from "@/lib/utils/time";

export function InviteCard({
  invite,
  currentUserId,
}: {
  invite: InviteWithDetails;
  currentUserId: string;
}) {
  const joinedParticipants = invite.participants.filter(
    (participant) => participant.status === "joined",
  );
  const openSpots = Math.max(
    invite.max_participants - joinedParticipants.length,
    0,
  );
  const joined = joinedParticipants.some(
    (participant) => participant.user_id === currentUserId,
  );
  const hosting = invite.host_id === currentUserId;
  const startingSoon = isStartingSoon(invite.start_at);

  return (
    <Card className="grid gap-4 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
              {invite.restaurant.name}
            </h2>
            <Badge
              variant={
                invite.visibility === "campus_public" ? "warm" : "indigo"
              }
            >
              {formatVisibility(invite.visibility)}
            </Badge>
            {startingSoon ? (
              <Badge variant="urgent">Starting soon</Badge>
            ) : null}
            {hosting ? (
              <Badge variant="indigo">Hosting</Badge>
            ) : joined ? (
              <Badge variant="indigo">Joined</Badge>
            ) : null}
          </div>
          <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <MapPin size={15} />
            {invite.restaurant.address}
          </p>
        </div>
        <Badge variant={openSpots > 0 ? "warm" : "urgent"}>
          {openSpots > 0 ? `${openSpots} open` : "Full"}
        </Badge>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="flex items-center gap-2 rounded-[8px] bg-[#f7f7fb] px-3 py-2 text-sm font-semibold text-[var(--brand-eggplant)]">
          <Clock size={16} />
          {formatInviteTime(invite.start_at)}
        </div>
        <div className="flex items-center gap-2 rounded-[8px] bg-[#f7f7fb] px-3 py-2 text-sm font-semibold text-[var(--brand-eggplant)]">
          <Users size={16} />
          {joinedParticipants.length}/{invite.max_participants}
        </div>
        <div className="rounded-[8px] bg-[#f7f7fb] px-3 py-2 text-sm font-semibold text-[var(--brand-eggplant)]">
          Host: {invite.host.display_name}
        </div>
      </div>

      {invite.message ? (
        <p className="rounded-[8px] border border-[var(--border)] bg-white px-3 py-2 text-sm leading-6 text-[var(--text-muted)]">
          {invite.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex -space-x-2">
          {joinedParticipants.slice(0, 5).map((participant) => (
            <span
              key={participant.id}
              className="grid size-8 place-items-center rounded-full border-2 border-white bg-[var(--brand-eggplant)] text-xs font-black text-white"
              title={participant.profile.display_name}
            >
              {participant.profile.display_name.slice(0, 1).toUpperCase()}
            </span>
          ))}
        </div>
        <Button asChild variant={joined || hosting ? "secondary" : "primary"}>
          <Link href={`/invites/${invite.id}`}>
            {joined || hosting ? "View details" : "Join or view"}
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function formatVisibility(visibility: InviteWithDetails["visibility"]) {
  if (visibility === "friends_only") {
    return "Friends";
  }

  if (visibility === "private_link") {
    return "Private";
  }

  return "Campus";
}
