import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { stock } from "@/lib/stock";

const ROLE_FALLBACK: Record<string, Parameters<typeof stock>[0]> = {
  lodge: "decoySpread",
  dog_handler: "boatHunter",
  photographer: "featherDetail",
  leather_goods: "leatherMark",
  speaker: "lodgeFire",
  other: "capPortrait",
};

const ROLE_LABEL: Record<string, string> = {
  lodge: "Lodge",
  dog_handler: "Dog Handler",
  photographer: "Photographer",
  leather_goods: "Pintail Goods",
  speaker: "Teaching",
  other: "Partner",
};

export default async function VendorsPage() {
  const supabase = await createClient();
  const { data: vendors, error } = await supabase
    .from("vendors")
    .select("id, name, slug, role, description, featured_photo_url")
    .order("name", { ascending: true });

  return (
    <div>
      <PageHeader title="The Hosting Team" subtitle="Who you'll meet on the trip." />
      {error ? (
        <EmptyState>Couldn&apos;t load the hosting team right now.</EmptyState>
      ) : !vendors || vendors.length === 0 ? (
        <EmptyState>Vendor profiles are on the way.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {vendors.map((v) => (
            <li key={v.id}>
              <Link href={`/vendors/${v.slug}`}>
                <Card className="overflow-hidden transition-colors hover:border-primary">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      v.featured_photo_url ??
                      stock(ROLE_FALLBACK[v.role] ?? "decoySpread")
                    }
                    alt={v.name}
                    className="h-32 w-full object-cover"
                  />
                  <CardContent className="pt-6">
                    <p className="text-xs uppercase tracking-wide text-primary">
                      {ROLE_LABEL[v.role] ?? "Partner"}
                    </p>
                    <p className="mt-1 font-serif text-xl">{v.name}</p>
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
