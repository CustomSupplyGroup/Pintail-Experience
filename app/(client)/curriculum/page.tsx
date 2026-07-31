import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getSelectedTrip } from "@/lib/trip";
import { getTripCurriculum } from "@/lib/content";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function CurriculumPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { trip, error: tripError } = await getSelectedTrip(supabase, user);
  if (tripError || !trip) {
    return (
      <div>
        <PageHeader title="Curriculum" />
        <EmptyState>
          The teaching library will fill in as sessions are published.
        </EmptyState>
      </div>
    );
  }

  const { sessions, error } = await getTripCurriculum(supabase, trip.id);

  return (
    <div>
      <Link
        href="/trip"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Trip Info
      </Link>
      <div className="mt-2">
        <PageHeader
          title="Curriculum"
          subtitle="Teaching sessions in text and audio."
        />
      </div>
      {error ? (
        <EmptyState>Couldn&apos;t load the curriculum right now.</EmptyState>
      ) : sessions.length === 0 ? (
        <EmptyState>
          The teaching library will fill in as sessions are published.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s, i) => (
            <li key={s.id}>
              <Link href={`/curriculum/${s.id}`}>
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="pt-6">
                    <p className="text-xs uppercase tracking-wide text-primary">
                      Session {i + 1}
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
