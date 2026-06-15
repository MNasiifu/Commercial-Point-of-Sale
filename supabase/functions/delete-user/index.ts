// DAS POS — Delete User Edge Function (soft delete)
//
// Soft-deletes auth user + sets profiles.deleted_at via admin_soft_delete_user RPC.
// Requires admin caller JWT. Blocks self-deletion.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "https://pos.musadan.com/",
]);

function corsHeaders(requestOrigin: string | null): Record<string, string> {
  const base: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (requestOrigin && ALLOWED_ORIGINS.has(requestOrigin)) {
    base["Access-Control-Allow-Origin"] = requestOrigin;
    base["Vary"] = "Origin";
  }

  return base;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers,
      });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    const callerClient = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const {
      data: { user: caller },
      error: callerErr,
    } = await callerClient.auth.getUser();

    if (callerErr || !caller) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers,
      });
    }

    const { data: callerProfile, error: profileErr } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .is("deleted_at", null)
      .single();

    if (
      profileErr ||
      (callerProfile as { role: string } | null)?.role !== "admin"
    ) {
      return new Response(
        JSON.stringify({ error: "Forbidden: admin access required" }),
        { status: 403, headers },
      );
    }

    const body = await req.json();
    const { user_id, email } = body as { user_id: string; email: string };

    if (!user_id || !email) {
      return new Response(
        JSON.stringify({ error: "user_id and email are required" }),
        { status: 400, headers },
      );
    }

    if (user_id === caller.id) {
      return new Response(
        JSON.stringify({ error: "You cannot remove your own account" }),
        { status: 403, headers },
      );
    }

    // Mark profile deleted + write audit (validates email match)
    const { error: rpcErr } = await callerClient.rpc("admin_soft_delete_user", {
      p_user_id: user_id,
      p_email: email,
    });

    if (rpcErr) {
      console.error("[delete-user] RPC error:", rpcErr.message);
      return new Response(JSON.stringify({ error: rpcErr.message }), {
        status: 422,
        headers,
      });
    }

    // Soft-delete auth user. GoTrue also hard-deletes all refresh-token sessions
    // for this user (models.Logout) — no separate signOut needed.
    // Note: admin.signOut() expects a user JWT, not a user id, so it cannot be
    // used here when the target user may have no active session.
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(
      user_id,
      true,
    );

    if (deleteErr) {
      console.error("[delete-user] deleteUser error:", deleteErr.message);
      await adminClient
        .from("profiles")
        .update({ deleted_at: null, is_active: true })
        .eq("id", user_id);
      return new Response(JSON.stringify({ error: deleteErr.message }), {
        status: 500,
        headers,
      });
    }

    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (err) {
    console.error("[delete-user] Unhandled error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers },
    );
  }
});
