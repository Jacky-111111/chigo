import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { Friendship, Profile } from "@/types/database";

export type FriendshipWithProfiles = Friendship & {
  requester: Profile;
  addressee: Profile;
};

export type FriendSearchResult = Profile & {
  friendship: Friendship | null;
};

export type FriendOverview = {
  acceptedFriends: Profile[];
  incomingRequests: FriendshipWithProfiles[];
  outgoingRequests: FriendshipWithProfiles[];
};

export async function getFriendOverview(
  currentUserId: string,
): Promise<FriendOverview> {
  const friendships = await listFriendshipsForUser(currentUserId);
  const hydrated = await hydrateFriendships(friendships);

  return {
    acceptedFriends: hydrated
      .filter((friendship) => friendship.status === "accepted")
      .map((friendship) =>
        friendship.requester_id === currentUserId
          ? friendship.addressee
          : friendship.requester,
      )
      .sort(sortProfilesByDisplayName),
    incomingRequests: hydrated
      .filter(
        (friendship) =>
          friendship.status === "pending" &&
          friendship.addressee_id === currentUserId,
      )
      .sort(sortFriendshipsByNewest),
    outgoingRequests: hydrated
      .filter(
        (friendship) =>
          friendship.status === "pending" &&
          friendship.requester_id === currentUserId,
      )
      .sort(sortFriendshipsByNewest),
  };
}

export async function getAcceptedFriends(currentUserId: string) {
  const overview = await getFriendOverview(currentUserId);
  return overview.acceptedFriends;
}

export async function searchProfilesForFriendRequest(
  currentUserId: string,
  rawQuery: string,
) {
  if (!hasSupabaseEnv()) {
    return [] satisfies FriendSearchResult[];
  }

  const query = rawQuery.trim().replace(/[%,]/g, "");

  if (query.length < 2) {
    return [] satisfies FriendSearchResult[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", currentUserId)
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(12);

  if (error) {
    throw new Error(error.message);
  }

  const profiles = ((data ?? []) as Profile[]).sort(sortProfilesByDisplayName);
  const friendships = await listFriendshipsForUser(currentUserId);
  const friendshipByProfileId = new Map<string, Friendship>();

  for (const friendship of friendships) {
    const otherUserId =
      friendship.requester_id === currentUserId
        ? friendship.addressee_id
        : friendship.requester_id;
    friendshipByProfileId.set(otherUserId, friendship);
  }

  return profiles.map((profile) => ({
    ...profile,
    friendship: friendshipByProfileId.get(profile.id) ?? null,
  }));
}

export async function getProfileByUsername(username: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Profile | null;
}

export async function getFriendshipBetweenUsers(
  userId: string,
  otherUserId: string,
) {
  const friendships = await listFriendshipsForUser(userId);

  return (
    friendships.find(
      (friendship) =>
        friendship.requester_id === otherUserId ||
        friendship.addressee_id === otherUserId,
    ) ?? null
  );
}

export async function areAcceptedFriends(userId: string, otherUserId: string) {
  const friendship = await getFriendshipBetweenUsers(userId, otherUserId);
  return friendship?.status === "accepted";
}

async function listFriendshipsForUser(userId: string) {
  if (!hasSupabaseEnv()) {
    return [] satisfies Friendship[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Friendship[];
}

async function hydrateFriendships(friendships: Friendship[]) {
  if (friendships.length === 0) {
    return [] satisfies FriendshipWithProfiles[];
  }

  const profileIds = [
    ...new Set(
      friendships.flatMap((friendship) => [
        friendship.requester_id,
        friendship.addressee_id,
      ]),
    ),
  ];
  const profiles = await getProfilesByIds(profileIds);

  return friendships.flatMap((friendship) => {
    const requester = profiles.get(friendship.requester_id);
    const addressee = profiles.get(friendship.addressee_id);

    if (!requester || !addressee) {
      return [];
    }

    return [{ ...friendship, requester, addressee }];
  });
}

export async function getProfilesByIds(profileIds: string[]) {
  if (!hasSupabaseEnv() || profileIds.length === 0) {
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

function sortProfilesByDisplayName(a: Profile, b: Profile) {
  return a.display_name.localeCompare(b.display_name);
}

function sortFriendshipsByNewest(a: Friendship, b: Friendship) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}
