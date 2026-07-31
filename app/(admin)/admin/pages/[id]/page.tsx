import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { PageForm } from "../page-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deletePage } from "../actions";

export default async function EditTripPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: page, error } = await supabase
    .from("trip_pages")
    .select("id, title, slug, content, sort_order, visible")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("edit info page: read failed", error.message);
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href="/admin/pages"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to logistics
        </Link>
        <div className="mt-2">
          <PageHeader title="Edit info page" />
        </div>
        <EmptyState>Couldn&apos;t load this page: {error.message}</EmptyState>
      </div>
    );
  }

  if (!page) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/pages"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to logistics
      </Link>
      <div className="mt-2 flex items-start justify-between gap-4">
        <PageHeader title="Edit info page" />
        <form action={deletePage}>
          <input type="hidden" name="id" value={page.id} />
          <ConfirmSubmitButton
            variant="ghost"
            size="sm"
            className="mt-1 text-destructive"
            confirmText="Delete this info page? This can't be undone."
          >
            Delete
          </ConfirmSubmitButton>
        </form>
      </div>
      <PageForm page={page} tripId={null} />
    </div>
  );
}
