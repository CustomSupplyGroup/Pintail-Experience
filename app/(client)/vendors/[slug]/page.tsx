import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/page-header";
import { Markdown } from "@/components/markdown";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: vendor, error } = await supabase
    .from("vendors")
    .select(
      "name, role, description, website_url, contact_name, contact_phone, featured_photo_url",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("vendor detail: read failed", error.message);
    return (
      <article className="space-y-5">
        <Link
          href="/vendors"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← The Hosting Team
        </Link>
        <EmptyState>Couldn&apos;t load this profile right now.</EmptyState>
      </article>
    );
  }

  if (!vendor) notFound();

  return (
    <article className="space-y-5">
      <Link
        href="/vendors"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← The Hosting Team
      </Link>

      {vendor.featured_photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={vendor.featured_photo_url}
          alt={vendor.name}
          className="aspect-video w-full rounded-lg object-cover"
        />
      )}

      <header>
        <p className="text-xs uppercase tracking-wide text-primary">
          {vendor.role.replace(/_/g, " ")}
        </p>
        <h1 className="mt-1 font-serif text-3xl leading-tight">{vendor.name}</h1>
      </header>

      {vendor.description && <Markdown>{vendor.description}</Markdown>}

      <div className="space-y-1 text-sm text-muted-foreground">
        {vendor.contact_name && <p>Contact: {vendor.contact_name}</p>}
        {vendor.contact_phone && <p>{vendor.contact_phone}</p>}
        {vendor.website_url && (
          <a
            href={vendor.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            Visit website
          </a>
        )}
      </div>
    </article>
  );
}
