import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { CurriculumForm } from "../curriculum-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteCurriculum } from "../actions";

export default async function EditCurriculumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from("curriculum_sessions")
    .select(
      "id, session_number, title, scripture_reference, written_content, audio_mux_id, video_mux_id, discussion_questions, published_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("edit curriculum: session read failed", error.message);
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href="/admin/curriculum"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to curriculum
        </Link>
        <div className="mt-2">
          <PageHeader title="Edit session" />
        </div>
        <EmptyState>Couldn&apos;t load this session: {error.message}</EmptyState>
      </div>
    );
  }

  if (!session) notFound();

  const questions = Array.isArray(session.discussion_questions)
    ? (session.discussion_questions as unknown[]).map(String)
    : [];

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/curriculum"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to curriculum
      </Link>
      <div className="mt-2 flex items-start justify-between gap-4">
        <PageHeader title="Edit session" />
        <form action={deleteCurriculum}>
          <input type="hidden" name="id" value={session.id} />
          <ConfirmSubmitButton
            variant="ghost"
            size="sm"
            className="mt-1 text-destructive"
            confirmText="Delete this session? This can't be undone."
          >
            Delete
          </ConfirmSubmitButton>
        </form>
      </div>
      <CurriculumForm
        session={{ ...session, discussion_questions: questions }}
        tripId={null}
      />
    </div>
  );
}
