import Link from "next/link";
import { ImageUp } from "lucide-react";
import { MenuUploadSummaryCard } from "@/components/menus/menu-upload-summary-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { listMyMenuUploads } from "@/lib/services/menus";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";

export const metadata = {
  title: "Menus",
};

export const dynamic = "force-dynamic";

export default async function MenusPage() {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const uploads = await listMyMenuUploads(user.id);

  return (
    <section className="page-shell grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
            Menu assistant
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Upload menu photos, translate unfamiliar dishes, and keep AI
            estimates linked to your restaurants.
          </p>
        </div>
        <Button asChild>
          <Link href="/menus/new">
            <ImageUp size={17} />
            Upload menu
          </Link>
        </Button>
      </div>

      {uploads.length > 0 ? (
        <div className="grid gap-4">
          {uploads.map((upload) => (
            <MenuUploadSummaryCard key={upload.id} upload={upload} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No menus analyzed yet"
          description="Upload a clear menu photo to get translations, dish explanations, and preference-aware warnings."
          action={
            <Button asChild>
              <Link href="/menus/new">
                <ImageUp size={17} />
                Upload menu
              </Link>
            </Button>
          }
        />
      )}
    </section>
  );
}
