import { AppNav } from "@/components/layout/app-nav";
import { requireUser, getCurrentProfile } from "@/lib/services/profiles";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();
  const profile = await getCurrentProfile(user.id);

  return (
    <div className="min-h-screen">
      <AppNav displayName={profile?.display_name} />
      <main className="py-6 md:py-8">{children}</main>
    </div>
  );
}
