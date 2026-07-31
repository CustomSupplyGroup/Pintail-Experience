import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { homePathForRole } from "@/lib/auth";

// Handles the magic-link / OTP redirect: exchanges the code for a session,
// then sends the user to the right surface for their role.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirect");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let role = null;
  if (user) {
    const { data, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (roleError) {
      console.error("auth callback: role lookup failed", roleError.message);
      return NextResponse.redirect(`${origin}/home`);
    }
    role = data?.role ?? null;
  }

  return NextResponse.redirect(`${origin}${homePathForRole(role)}`);
}
