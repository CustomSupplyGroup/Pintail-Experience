import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/page-header";
import { Markdown } from "@/components/markdown";
import { AudioPlayer } from "@/components/audio-player";

export default async function CurriculumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from("curriculum_sessions")
    .select(
      "session_number, title, scripture_reference, written_content, audio_mux_id, discussion_questions, published_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("curriculum detail: session read failed", error.message);
    return (
      <article className="space-y-5">
        <Link
          href="/curriculum"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Curriculum
        </Link>
        <EmptyState>Couldn&apos;t load this session right now.</EmptyState>
      </article>
    );
  }

  if (!session || !session.published_at) notFound();

  const questions = Array.isArray(session.discussion_questions)
    ? (session.discussion_questions as unknown[]).map(String)
    : [];

  return (
    <article className="space-y-5">
      <Link
        href="/curriculum"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Curriculum
      </Link>

      <header>
        <p className="text-xs uppercase tracking-wide text-primary">
          Session {session.session_number}
        </p>
        <h1 className="mt-1 font-serif text-3xl leading-tight">
          {session.title}
        </h1>
        {session.scripture_reference && (
          <p className="mt-2 italic text-muted-foreground">
            {session.scripture_reference}
          </p>
        )}
      </header>

      {session.audio_mux_id && (
        <AudioPlayer playbackId={session.audio_mux_id} title={session.title} />
      )}

      {session.written_content && <Markdown>{session.written_content}</Markdown>}

      {questions.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-serif text-lg">Discussion</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-foreground/90">
            {questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}
