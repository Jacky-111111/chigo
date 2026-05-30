import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InviteCard } from "@/components/invites/invite-card";
import { InviteFilters } from "@/components/invites/invite-filters";
import { listOpenInvites, type InviteFilter } from "@/lib/services/invites";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";

export const metadata = {
  title: "Invites",
};

export const dynamic = "force-dynamic";

type InvitesPageProps = {
  searchParams?: Promise<{
    filter?: InviteFilter;
    error?: string;
    message?: string;
  }>;
};

const validFilters = new Set(["all", "starting-soon", "open-spots", "mine"]);

export default async function InvitesPage({ searchParams }: InvitesPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const activeFilter =
    params?.filter && validFilters.has(params.filter) ? params.filter : "all";
  const invites = await listOpenInvites(user.id, activeFilter);

  return (
    <section className="page-shell grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
            Campus dining invites
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            See who is grabbing food nearby, join a plan, or start your own for right now.
          </p>
        </div>
        <Button asChild>
          <Link href="/invites/new">
            <Plus size={17} />
            Create invite
          </Link>
        </Button>
      </div>

      {params?.error ? (
        <div className="rounded-[8px] border border-[rgba(224,92,32,0.24)] bg-[rgba(224,92,32,0.08)] p-3 text-sm font-semibold text-[var(--food-chili)]">
          {params.error}
        </div>
      ) : null}

      {params?.message ? (
        <div className="rounded-[8px] border border-[rgba(108,107,226,0.22)] bg-[rgba(108,107,226,0.1)] p-3 text-sm font-semibold text-[var(--brand-eggplant)]">
          {params.message}
        </div>
      ) : null}

      <InviteFilters active={activeFilter} />

      {invites.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {invites.map((invite) => (
            <InviteCard key={invite.id} invite={invite} currentUserId={user.id} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No open invites yet"
          description="Be the person who starts dinner. Create an invite from a nearby restaurant and classmates can join."
          action={
            <Button asChild>
              <Link href="/invites/new">Create invite</Link>
            </Button>
          }
        />
      )}
    </section>
  );
}
