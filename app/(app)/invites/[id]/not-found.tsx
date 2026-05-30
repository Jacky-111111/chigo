import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function InviteNotFound() {
  return (
    <section className="page-shell">
      <EmptyState
        title="Invite not found"
        description="This invite may have been canceled, expired, or removed."
        action={
          <Button asChild>
            <Link href="/invites">Back to invites</Link>
          </Button>
        }
      />
    </section>
  );
}
