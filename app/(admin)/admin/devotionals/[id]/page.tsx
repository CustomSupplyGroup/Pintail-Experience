import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { DevotionalForm } from "../devotional-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteDevotional } from "../actions";

export default async function EditDevotionalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: devotional, error } = await supabase
    .from("devotionals")
    .select(
      "id, title, scripture, day_offset, scheduled_for, written_content, audio_mux_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("edit devotional: read failed", error.message);
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href="/admin/devotionals"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to devotionals
        </Link>
        <div className="mt-2">
          <PageHeader title="Edit devotional" />
        </div>
        <EmptyState>Couldn&apos;t load this devotional: {error.message}</EmptyState>
      </div>
    );
  }

  if (!devotional) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/devotionals"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to devotionals
      </Link>
      <div className="mt-2 flex items-start justify-between gap-4">
        <PageHeader title="Edit devotional" />
        <form action={deleteDevotional}>
          <input type="hidden" name="id" value={devotional.id} />
          <ConfirmSubmitButton
            variant="ghost"
            size="sm"
            className="mt-1 text-destructive"
            confirmText="Delete this devotional? This can't be undone."
          >
            Delete
          </ConfirmSubmitButton>
        </form>
      </div>
      <DevotionalForm devotional={devotional} tripId={null} />
    </div>
  );
}
