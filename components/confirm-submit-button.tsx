"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

/**
 * A submit button that asks for confirmation before letting the form submit.
 * Use for destructive actions (deletes) so a single click can't fire them.
 */
export function ConfirmSubmitButton({
  confirmText = "Are you sure? This can't be undone.",
  children,
  ...props
}: ComponentProps<typeof Button> & { confirmText?: string }) {
  return (
    <Button
      type="submit"
      {...props}
      onClick={(e) => {
        if (!window.confirm(confirmText)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </Button>
  );
}
