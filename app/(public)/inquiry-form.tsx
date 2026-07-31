"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { submitInquiry, type InquiryState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: InquiryState = { ok: false, message: "" };

export function InquiryForm() {
  const [state, formAction, pending] = useActionState(
    submitInquiry,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message);
      formRef.current?.reset();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required placeholder="John Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" name="phone" type="tel" placeholder="(555) 555-5555" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">What draws you to a trip like this?</Label>
        <Textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Tell us a little about yourself…"
        />
      </div>
      {/* Honeypot — hidden from humans; bots that fill it are dropped server-side. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Request an invitation"}
      </Button>
    </form>
  );
}
