import { emailConfigured } from "@/lib/email";
import { PageHeader } from "@/components/page-header";
import { BroadcastForm } from "./broadcast-form";

export default function BroadcastPage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Send a broadcast"
        subtitle="Posts an in-app announcement to every attendee, with an option to also email them."
      />
      <BroadcastForm emailReady={emailConfigured()} />
    </div>
  );
}
