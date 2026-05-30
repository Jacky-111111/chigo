import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <section className="page-shell grid gap-4">
      <Card className="h-32 animate-pulse bg-white p-5" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="h-56 animate-pulse bg-white p-5" />
        <Card className="h-56 animate-pulse bg-white p-5" />
      </div>
    </section>
  );
}
