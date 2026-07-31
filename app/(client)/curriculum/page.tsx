import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function CurriculumPage() {
  const supabase = await createClient();
  const { data: sessions, error } = await supabase
    .from("curriculum_sessions")
    .select("id, session_number, title, scripture_reference, audio_mux_id")
    .not("published_at", "is", null)
    .order("session_number", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Curriculum"
        subtitle="Teaching sessions in text and audio."
      />
      {error ? (
        <EmptyState>Couldn&apos;t load the curriculum right now.</EmptyState>
      ) : !sessions || sessions.length === 0 ? (
        <EmptyState>
          The teaching library will fill in as sessions are published.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link href={`/curriculum/${s.id}`}>
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="pt-6">
                    <p className="text-xs uppercase tracking-wide text-primary">
                      Session {s.session_number}
                    </p>
                    <p className="mt-1 font-serif text-xl">{s.title}</p>
                    {s.scripture_reference && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {s.scripture_reference}
                        {s.audio_mux_id ? " · audio" : ""}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
