import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { SeriesForm } from "../series-form";

export default function NewSeriesPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/content"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to content
      </Link>
      <div className="mt-2">
        <PageHeader
          title="New series"
          subtitle="Give it a name and a kind. You'll author entries next."
        />
      </div>
      <SeriesForm series={null} />
    </div>
  );
}
