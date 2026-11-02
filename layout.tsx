import "./globals.css";
export const metadata = { title: "Zipline — expiring file sharing", icons: { icon: "/icon.svg" } };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
