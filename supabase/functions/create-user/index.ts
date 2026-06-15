// DAS POS — Create User Edge Function
//
// Required secrets (set via Supabase dashboard → Settings → Edge Functions):
//   SUPABASE_URL               Injected automatically by Supabase
//   SUPABASE_SERVICE_ROLE_KEY  Injected automatically by Supabase
//   SMTP_HOST                  Your SMTP server hostname
//   SMTP_PORT                  Your SMTP server port (e.g. 465 or 587, default 587)
//   SMTP_USER                  SMTP auth username — also used as the From address
//   SMTP_PASS                  SMTP authentication password
//   APP_NAME                   Optional display name in emails (default: "DAS POS")

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";
import nodemailer from "npm:nodemailer@6";

// ── Environment ────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_NAME = Deno.env.get("APP_NAME") ?? "DAS POS";

// ── Allowed CORS origins ───────────────────────────────────
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "https://pos.musadan.com/",
]);

/**
 * Build CORS headers for the given request origin.
 * If the origin is in the allowlist it is reflected back; otherwise the
 * header is omitted so the browser blocks the preflight.
 */
function corsHeaders(requestOrigin: string | null): Record<string, string> {
  const base: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (requestOrigin && ALLOWED_ORIGINS.has(requestOrigin)) {
    base["Access-Control-Allow-Origin"] = requestOrigin;
    // Required when credentials (Authorization header) are sent
    base["Vary"] = "Origin";
  }

  return base;
}

// ── Helpers ────────────────────────────────────────────────
function generateTempPassword(): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes)
    .map((b) => charset[b % charset.length])
    .join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── SMTP transporter (mirrors working sendWelcomeEmail pattern) ──────────
function buildTransporter() {
  const host = Deno.env.get("SMTP_HOST");
  const port = Number(Deno.env.get("SMTP_PORT") ?? "587");
  const user = Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASS");

  console.log("[EMAIL] SMTP env:", {
    host: host ?? "NOT SET",
    port,
    user: user ? `${user.slice(0, 4)}****` : "NOT SET",
    pass: pass ? "****SET****" : "NOT SET",
  });

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    logger: true,
    debug: true,
  });
}

/**
 * Send a welcome e-mail via SMTP using nodemailer.
 * Failures are logged and surfaced to the caller but do NOT abort the
 * request — the user was already created successfully.
 */
async function sendWelcomeEmail(
  email: string,
  fullName: string,
  tempPassword: string,
): Promise<{ sent: boolean; error?: string }> {
  console.log("[EMAIL] === sendWelcomeEmail START ===");
  console.log("[EMAIL] Recipient:", email, "| Name:", fullName);

  const transporter = buildTransporter();
  if (!transporter) {
    console.error("[EMAIL] buildTransporter returned null — SMTP not configured");
    return { sent: false, error: "SMTP not configured" };
  }

  // Always use SMTP_USER as sender — SMTP servers reject mismatched from addresses
  const fromAddress = Deno.env.get("SMTP_USER")!;
  console.log("[EMAIL] From address (SMTP_USER):", fromAddress);

  const contact = escapeHtml(fullName);

  const text = [
    `Hello ${fullName},`,
    "",
    `Your ${APP_NAME} account has been created by an administrator.`,
    "Use the credentials below to sign in:",
    `  Email: ${email}`,
    `  Temporary Password: ${tempPassword}`,
    "",
    "IMPORTANT: You will be required to change your password immediately after your first login.",
    "Keep these credentials private and do not share them.",
    "",
    "Regards,",
    `The ${APP_NAME} Team`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#1a1a2e">${APP_NAME}</h2>
      <p>Hello <strong>${contact}</strong>,</p>
      <p>Your account has been created by an administrator.
         Use the credentials below to sign in.</p>
      <table style="border:1px solid #e0e0e0;border-radius:8px;
                    padding:16px 24px;background:#f9f9f9;width:100%">
        <tr>
          <td style="padding:6px 0;color:#555">Email</td>
          <td style="padding:6px 0;font-weight:600">${email}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#555">Temporary password</td>
          <td style="padding:6px 0;font-weight:600;
                     font-family:monospace;font-size:1.1em">
            ${tempPassword}
          </td>
        </tr>
      </table>
      <p style="color:#d32f2f;font-size:0.9em;margin-top:16px">
        ⚠ You will be required to change your password immediately
        after your first login.<br>
        Keep these credentials private and do not share them.
      </p>
    </div>
  `;

  try {
    console.log("[EMAIL] Calling transporter.sendMail()...");
    const info = await transporter.sendMail({
      from: `"${APP_NAME}" <${fromAddress}>`,
      to: email,
      subject: `Your ${APP_NAME} account has been created`,
      text,
      html,
    });

    console.log("[EMAIL] === SEND RESULT ===");
    console.log("[EMAIL] messageId:", info.messageId);
    console.log("[EMAIL] response:", info.response);
    console.log("[EMAIL] accepted:", JSON.stringify(info.accepted));
    console.log("[EMAIL] rejected:", JSON.stringify(info.rejected));
    console.log("[EMAIL] envelope:", JSON.stringify(info.envelope));

    if (info.rejected && info.rejected.length > 0) {
      console.error("[EMAIL] SMTP server REJECTED recipients:", info.rejected);
      return { sent: false, error: `SMTP server rejected: ${info.rejected.join(", ")}` };
    }

    if (!info.accepted || info.accepted.length === 0) {
      console.error("[EMAIL] No accepted recipients — mail was NOT delivered");
      return { sent: false, error: "No recipients accepted by SMTP server" };
    }

    console.log("[EMAIL] === sendWelcomeEmail SUCCESS ===");
    return { sent: true };
  } catch (err) {
    const error = err as Error;
    console.error("[EMAIL] === SEND FAILED ===");
    console.error("[EMAIL] Error name:", error.name);
    console.error("[EMAIL] Error message:", error.message);
    console.error("[EMAIL] Error stack:", error.stack);
    if ("code" in error) console.error("[EMAIL] Error code:", (error as { code: string }).code);
    if ("command" in error) console.error("[EMAIL] SMTP command:", (error as { command: string }).command);
    if ("responseCode" in error) {
      console.error("[EMAIL] SMTP responseCode:", (error as { responseCode: number }).responseCode);
    }
    return { sent: false, error: error.message };
  }
}

// ── Main handler ───────────────────────────────────────────
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    // ── 1. Verify caller token ───────────────────────────
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers,
      });
    }

    // Admin client — service role, full DB access
    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // Caller-scoped client — forwards user JWT so auth.uid() resolves in RPCs
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

    // Verify caller is an admin
    const { data: callerProfile, error: profileErr } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
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

    // ── 2. Parse & validate payload ──────────────────────
    const body = await req.json();
    const { full_name, email, role, branch_id } = body as {
      full_name: string;
      email: string;
      role: string;
      branch_id: string;
    };

    if (!full_name || !email || !role || !branch_id) {
      return new Response(
        JSON.stringify({
          error: "full_name, email, role, and branch_id are required",
        }),
        { status: 400, headers },
      );
    }

    if (!["admin", "manager", "teller"].includes(role)) {
      return new Response(
        JSON.stringify({
          error: "Invalid role. Must be admin, manager, or teller",
        }),
        { status: 400, headers },
      );
    }

    // ── 3. Generate temporary password ───────────────────
    const tempPassword = generateTempPassword();

    // ── 4. Create auth user ──────────────────────────────
    const { data: authData, error: createErr } =
      await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name },
      });

    if (createErr) {
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 422,
        headers,
      });
    }

    const userId = authData.user!.id;

    // ── 5. Setup profile via RPC ─────────────────────────
    const { error: rpcErr } = await callerClient.rpc("admin_setup_new_user", {
      p_user_id: userId,
      p_full_name: full_name,
      p_email: email,
      p_role: role,
      p_branch_id: branch_id,
    });

    if (rpcErr) {
      // Rollback: remove the auth user to keep the DB consistent
      await adminClient.auth.admin.deleteUser(userId);
      console.error("[create-user] RPC error:", rpcErr.message);
      return new Response(JSON.stringify({ error: rpcErr.message }), {
        status: 500,
        headers,
      });
    }

    // ── 6. Send welcome email (non-blocking on failure) ──
    console.log("[create-user] Step 6: Sending welcome email to", email);
    const emailResult = await sendWelcomeEmail(email, full_name, tempPassword);
    console.log("[create-user] Email result:", JSON.stringify(emailResult));

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        temp_password: tempPassword,
        emailSent: emailResult.sent,
        ...(emailResult.error && { emailWarning: emailResult.error }),
      }),
      { headers },
    );
  } catch (err) {
    console.error("[create-user] Unhandled error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers },
    );
  }
});
