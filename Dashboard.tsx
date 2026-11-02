"use client";
import { useCallback, useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";

type F = { id: string; name: string; size: number; createdAt: string; expiresAt: string; downloadCount: number; maxViews: number | null };
const origin = () => location.origin;
const mb = (n: number) => (n / 1048576).toFixed(1) + " MB";

export default function Dashboard() {
  const [files, setFiles] = useState<F[]>([]);
  const [used, setUsed] = useState(0), [quota, setQuota] = useState(1), [token, setToken] = useState("");
  const [ttl, setTtl] = useState("24h"), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const [done, setDone] = useState<{ id: string; qr: string } | null>(null);
  const [, tick] = useState(0);

  const load = useCallback(async () => {
    const r = await fetch("/api/files"); if (!r.ok) return location.href = "/login";
    const d = await r.json(); setFiles(d.files); setUsed(d.used); setQuota(d.quota); setToken(d.apiToken);
  }, []);
  useEffect(() => { load(); const t = setInterval(() => tick((x) => x + 1), 30000); return () => clearInterval(t); }, [load]);

  async function send(file: File) {
    setBusy(true); setErr("");
    try {
      const blob = await upload(file.name, file, { access: "public", handleUploadUrl: "/api/upload" });
      const r = await fetch("/api/files", { method: "POST", body: JSON.stringify({ url: blob.url, name: file.name, ttl }) });
      if (!r.ok) throw new Error((await r.json()).error);
      const { id } = await r.json();
      const QR = (await import("qrcode")).default;
      setDone({ id, qr: await QR.toDataURL(`${origin()}/dl/${id}`, { width: 320, margin: 1 }) });
      load();
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }
  const copy = (id: string) => navigator.clipboard.writeText(`${origin()}/dl/${id}`);
  const remove = async (id: string) => { await fetch("/api/files", { method: "DELETE", body: JSON.stringify({ id }) }); load(); };
  const logout = async () => { await fetch("/api/auth", { method: "POST", body: JSON.stringify({ action: "logout" }) }); location.href = "/login"; };
  const rotate = async () => setToken((await (await fetch("/api/token", { method: "POST" })).json()).apiToken);

  return (
    <main className="wrap">
      <header><img src="/icon.svg" width={28} alt="" /><b>Zipline</b>
        <span className="muted grow" />
        <span className="muted">{mb(used)} / {mb(quota)}</span>
        <button className="btn" onClick={logout}>Sign out</button></header>
      <div className="bar"><i style={{ width: `${Math.min(100, (used / quota) * 100)}%` }} /></div>

      <label className={"drop" + (busy ? " busy" : "")}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) send(f); }}>
        <input type="file" hidden disabled={busy} onChange={(e) => e.target.files?.[0] && send(e.target.files[0])} />
        {busy ? "Uploading…" : "Drop a file or click to upload"}
        <select value={ttl} onClick={(e) => e.preventDefault()} onChange={(e) => setTtl(e.target.value)}>
          <option value="1h">Expires in 1 hour</option><option value="24h">Expires in 24 hours</option><option value="7d">Expires in 7 days</option>
        </select>
      </label>
      {err && <p className="err">{err}</p>}

      <h3>Active vault</h3>
      <ul className="vault">
        {files.length === 0 && <li className="muted">Nothing here yet.</li>}
        {files.map((f) => {
          const total = new Date(f.expiresAt).getTime() - new Date(f.createdAt).getTime();
          const left = Math.max(0, new Date(f.expiresAt).getTime() - Date.now());
          return (
            <li key={f.id}>
              <div className="row"><span className="grow">{f.name}</span>
                <span className="muted">{mb(f.size)} · {f.downloadCount} dl · {left > 36e5 ? Math.round(left / 36e5) + "h" : Math.ceil(left / 6e4) + "m"} left</span>
                <button className="btn" onClick={() => copy(f.id)}>Copy</button>
                <a className="btn" href={`/print/${f.id}`} target="_blank">Print</a>
                <button className="btn" onClick={() => remove(f.id)}>Delete</button></div>
              <div className="bar"><i style={{ width: `${(left / total) * 100}%` }} /></div>
            </li>);
        })}
      </ul>

      <h3>API token</h3>
      <code className="tok">{token}</code> <button className="btn" onClick={rotate}>Regenerate</button>
      <p className="muted">curl -H "Authorization: Bearer {token.slice(0, 7)}…" -F file=@a.png -F ttl=24h {origin()}/api/v1/upload</p>

      {done && (
        <div className="modal" onClick={() => setDone(null)}>
          <div className="card" onClick={(e) => e.stopPropagation()}>
            <img src={done.qr} width={200} alt="QR" />
            <code>{origin()}/dl/{done.id}</code>
            <div className="row"><button className="btn primary" onClick={() => copy(done.id)}>Copy link</button>
              <a className="btn" href={`/print/${done.id}`} target="_blank">Print card</a></div>
          </div>
        </div>)}
    </main>
  );
}
