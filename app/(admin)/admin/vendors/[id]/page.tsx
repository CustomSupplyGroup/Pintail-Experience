import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { VendorForm } from "../vendor-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteVendor } from "../actions";

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vendor, error } = await supabase
    .from("vendors")
    .select(
      "id, name, slug, role, description, website_url, contact_name, contact_phone, logo_url, featured_photo_url, featured",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("edit vendor: read failed", error.message);
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href="/admin/vendors"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to vendors
        </Link>
        <div className="mt-2">
          <PageHeader title="Edit vendor" />
        </div>
        <EmptyState>Couldn&apos;t load this vendor: {error.message}</EmptyState>
      </div>
    );
  }

  if (!vendor) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/vendors"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to vendors
      </Link>
      <div className="mt-2 flex items-start justify-between gap-4">
        <PageHeader title="Edit vendor" />
        <form action={deleteVendor}>
          <input type="hidden" name="id" value={vendor.id} />
          <ConfirmSubmitButton
            variant="ghost"
            size="sm"
            className="mt-1 text-destructive"
            confirmText={`Delete "${vendor.name}"? This can't be undone.`}
          >
            Delete
          </ConfirmSubmitButton>
        </form>
      </div>
      <VendorForm vendor={vendor} />
    </div>
  );
}
