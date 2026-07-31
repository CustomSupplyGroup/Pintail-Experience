"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { updateInquiryStatus, type InquiryState } from "./actions";

const selectClass =
  "flex h-8 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const STATUSES = ["new", "contacted", "qualified", "closed"];

const initialState: InquiryState = { ok: false, message: "" };

export function InquiryStatusSelect({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateInquiryStatus,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) toast.success(state.message);
    else if (state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} ref={formRef}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        disabled={pending}
        onChange={() => formRef.current?.requestSubmit()}
        className={selectClass}
        aria-label="Inquiry status"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </form>
  );
}
