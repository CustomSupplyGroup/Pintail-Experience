"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);

    const supabase = createClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (redirect) callbackUrl.searchParams.set("redirect", redirect);

    // Invite-only: never auto-create an account from the login form. Accounts
    // are provisioned by the admin invite flow; a stranger's email is a no-op.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl.toString(),
        shouldCreateUser: false,
      },
    });

    setSending(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Check your email for the sign-in link.");
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="font-heading text-lg">Link sent</p>
        <p className="mt-2 text-sm text-muted-foreground">
          If you&apos;re on the trip roster, a sign-in link is on its way to{" "}
          <span className="text-foreground">{email}</span>. Open it on this
          device to continue.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={sending}>
        {sending ? "Sending…" : "Send sign-in link"}
      </Button>
    </form>
  );
}
