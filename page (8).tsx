import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";
const human = (ms: number) => { const h = Math.floor(ms / 36e5); return h >= 24 ? `${Math.floor(h / 24)} day(s)` : h >= 1 ? `${h} hour(s)` : `${Math.max(1, Math.floor(ms / 6e4))} minute(s)`; };

export default async function Print({ params }: { params: { id: string } }) {
  const f = await db.file.findUnique({ where: { id: params.id } });
  if (!f || f.expiresAt < new Date()) notFound();
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/dl/${f.id}`;
  const svg = await QRCode.toString(link, { type: "svg", margin: 0, errorCorrectionLevel: "M" });
  return (
    <main className="print-wrap">
      <div className="tag">
        <div className="qr" dangerouslySetInnerHTML={{ __html: svg }} />
        <code>{link.replace(/^https?:\/\//, "")}</code>
        <b>{f.name}</b>
        <span>{(f.size / 1048576).toFixed(2)} MB · Self-destructs in {human(f.expiresAt.getTime() - Date.now())}</span>
      </div>
      <PrintButton />
    </main>
  );
}
