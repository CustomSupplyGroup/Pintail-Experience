import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];
export type AppUser = Database["public"]["Tables"]["users"]["Row"];

/** Returns the signed-in user's profile row (incl. role), or null. */
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("getCurrentUser: failed to load profile", error.message);
    return null;
  }
  return data;
}

const STAFF_ROLES: UserRole[] = ["founder", "admin", "staff"];

export function isStaff(role: UserRole | undefined | null): boolean {
  return role ? STAFF_ROLES.includes(role) : false;
}

/**
 * Throws "Forbidden" unless the caller is signed in AND staff. Call this as the
 * first line of every admin mutation server action — several of them use the
 * service-role client (which bypasses RLS), so the app layer is the only gate.
 */
export async function requireStaff(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    throw new Error("Forbidden: staff access required");
  }
  return user;
}

/** The friendly error state to return from a staff-gated action on Forbidden. */
export const FORBIDDEN_STATE = {
  ok: false as const,
  message: "You don't have access to do that.",
};

/** Where a user lands after authenticating, based on their role. */
export function homePathForRole(role: UserRole | undefined | null): string {
  return isStaff(role) ? "/admin" : "/home";
}
