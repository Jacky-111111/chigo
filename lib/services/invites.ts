import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type {
  DiningInvite,
  DiningInviteParticipant,
  Profile,
  Restaurant,
} from "@/types/database";

export type InviteWithDetails = DiningInvite & {
  restaurant: Restaurant;
  host: Profile;
  participants: Array<DiningInviteParticipant & { profile: Profile }>;
};

export type InviteFilter = "all" | "starting-soon" | "open-spots" | "mine";

export async function listOpenInvites(
  currentUserId: string,
  filter: InviteFilter = "all",
) {
  if (!hasSupabaseEnv()) {
    return [] satisfies InviteWithDetails[];
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: invites, error } = await supabase
    .from("dining_invites")
    .select("*")
    .eq("visibility", "campus_public")
    .eq("status", "open")
    .gt("expires_at", now)
    .order("start_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const detailed = await hydrateInvites((invites ?? []) as DiningInvite[]);

  return detailed.filter((invite) => {
    const joinedCount = invite.participants.filter(
      (participant) => participant.status === "joined",
    ).length;
    const isMine =
      invite.host_id === currentUserId ||
      invite.participants.some(
        (participant) =>
          participant.user_id === currentUserId &&
          participant.status === "joined",
      );

    if (filter === "starting-soon") {
      return new Date(invite.start_at).getTime() - Date.now() <= 45 * 60 * 1000;
    }

    if (filter === "open-spots") {
      return joinedCount < invite.max_participants;
    }

    if (filter === "mine") {
      return isMine;
    }

    return true;
  });
}

export async function listOpenInvitesForRestaurant(
  currentUserId: string,
  restaurantId: string,
) {
  if (!hasSupabaseEnv()) {
    return [] satisfies InviteWithDetails[];
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: invites, error } = await supabase
    .from("dining_invites")
    .select("*")
    .eq("visibility", "campus_public")
    .eq("status", "open")
    .eq("restaurant_id", restaurantId)
    .gt("expires_at", now)
    .order("start_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const detailed = await hydrateInvites((invites ?? []) as DiningInvite[]);

  return detailed.filter((invite) => {
    const joinedCount = invite.participants.filter(
      (participant) => participant.status === "joined",
    ).length;
    const isMine =
      invite.host_id === currentUserId ||
      invite.participants.some(
        (participant) =>
          participant.user_id === currentUserId &&
          participant.status === "joined",
      );

    return joinedCount < invite.max_participants || isMine;
  });
}

export async function getInviteDetail(inviteId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dining_invites")
    .select("*")
    .eq("id", inviteId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const [invite] = await hydrateInvites([data as DiningInvite]);
  return invite ?? null;
}

async function hydrateInvites(invites: DiningInvite[]) {
  if (invites.length === 0) {
    return [] satisfies InviteWithDetails[];
  }

  const supabase = await createClient();
  const restaurantIds = [
    ...new Set(invites.map((invite) => invite.restaurant_id)),
  ];
  const hostIds = [...new Set(invites.map((invite) => invite.host_id))];
  const inviteIds = invites.map((invite) => invite.id);

  const [
    { data: restaurants, error: restaurantsError },
    { data: hosts, error: hostsError },
    { data: participants, error: participantsError },
  ] = await Promise.all([
    supabase.from("restaurants").select("*").in("id", restaurantIds),
    supabase.from("profiles").select("*").in("id", hostIds),
    supabase
      .from("dining_invite_participants")
      .select("*")
      .in("invite_id", inviteIds)
      .order("joined_at", { ascending: true }),
  ]);

  if (restaurantsError) {
    throw new Error(restaurantsError.message);
  }

  if (hostsError) {
    throw new Error(hostsError.message);
  }

  if (participantsError) {
    throw new Error(participantsError.message);
  }

  const restaurantRows = (restaurants ?? []) as Restaurant[];
  const hostRows = (hosts ?? []) as Profile[];
  const participantRows = (participants ?? []) as DiningInviteParticipant[];

  const participantProfiles = participantRows.length
    ? await getProfilesByIds([
        ...new Set(participantRows.map((participant) => participant.user_id)),
      ])
    : new Map<string, Profile>();

  const restaurantMap = new Map(
    restaurantRows.map((restaurant) => [restaurant.id, restaurant]),
  );
  const hostMap = new Map(hostRows.map((host) => [host.id, host]));
  const participantsByInvite = new Map<
    string,
    Array<DiningInviteParticipant & { profile: Profile }>
  >();

  for (const participant of participantRows) {
    const profile = participantProfiles.get(participant.user_id);

    if (!profile) {
      continue;
    }

    const list = participantsByInvite.get(participant.invite_id) ?? [];
    list.push({ ...participant, profile });
    participantsByInvite.set(participant.invite_id, list);
  }

  return invites.flatMap((invite) => {
    const restaurant = restaurantMap.get(invite.restaurant_id);
    const host = hostMap.get(invite.host_id);

    if (!restaurant || !host) {
      return [];
    }

    return [
      {
        ...invite,
        restaurant,
        host,
        participants: participantsByInvite.get(invite.id) ?? [],
      },
    ];
  });
}

async function getProfilesByIds(profileIds: string[]) {
  if (profileIds.length === 0) {
    return new Map<string, Profile>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("id", profileIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as Profile[]).map((profile) => [profile.id, profile]),
  );
}
