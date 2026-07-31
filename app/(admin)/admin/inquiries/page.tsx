import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { InquiryStatusSelect } from "./inquiry-status-select";

export default async function InquiriesPage() {
  const supabase = await createClient();
  const { data: inquiries, error } = await supabase
    .from("inquiries")
    .select("id, name, email, phone, message, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div>
        <PageHeader title="Inquiries" />
        <EmptyState>Couldn&apos;t load inquiries: {error.message}</EmptyState>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Inquiries"
        subtitle="Leads from the public site."
      />
      {!inquiries || inquiries.length === 0 ? (
        <EmptyState>No inquiries yet.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {inquiries.map((q) => (
            <li key={q.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{q.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {q.email}
                    {q.phone ? ` · ${q.phone}` : ""}
                  </p>
                </div>
                <InquiryStatusSelect id={q.id} status={q.status} />
              </div>
              {q.message && (
                <p className="mt-3 text-sm text-muted-foreground">{q.message}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
