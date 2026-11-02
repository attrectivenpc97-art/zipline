"use client";
import { useState } from "react";
export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const r = await fetch("/api/auth", { method: "POST", body: JSON.stringify({ action: mode, email: d.get("email"), password: d.get("password") }) });
    if (r.ok) location.href = "/"; else setErr((await r.json()).error);
  }
  return (
    <main className="center">
      <form onSubmit={submit} className="card" style={{ width: 340 }}>
        <img src="/icon.svg" width={40} alt="" />
        <h2>{mode === "login" ? "Sign in" : "Create account"}</h2>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password (8+ chars)" required minLength={8} />
        {err && <p className="err">{err}</p>}
        <button className="btn primary">{mode === "login" ? "Sign in" : "Register"}</button>
        <a onClick={() => setMode(mode === "login" ? "register" : "login")} className="muted link">
          {mode === "login" ? "No account? Register" : "Have an account? Sign in"}
        </a>
      </form>
    </main>
  );
}
