"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPage() {
  const supabase = getSupabaseBrowser();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const redirectTo = typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback?redirect_to=/`
    : undefined;

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo }
    });
    // Browser redirecter selv videre til Supabase og tilbage til /auth/callback
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    });
    setSending(false);
    if (error) setMsg(error.message);
    else setMsg("Tjek din mail for login-link ✉️");
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Log ind</h1>

      <button
        onClick={signInWithGoogle}
        className="w-full border rounded-2xl px-4 py-2 shadow hover:bg-gray-50"
      >
        Fortsæt med Google
      </button>

      <div className="text-center text-sm text-gray-500">eller</div>

      <form onSubmit={sendMagicLink} className="space-y-3">
        <label className="block text-sm font-medium">Email</label>
        <input
          className="w-full border rounded-xl p-2"
          type="email"
          required
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          placeholder="din@email.dk"
        />
        <button
          disabled={sending}
          className="w-full border rounded-2xl px-4 py-2 shadow hover:bg-gray-50"
        >
          {sending ? "Sender link…" : "Send magic link"}
        </button>
      </form>

      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
